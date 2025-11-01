// app/api/admin/search/backfill/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSupabaseService } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPENAI_URL = "https://api.openai.com/v1/embeddings";
const MODEL = "text-embedding-3-small";
const DIMS = 1536;

// Optional: enable if you want unit-normed vectors
function normalize(vec: number[]): number[] {
  let n = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  if (!n || !Number.isFinite(n)) n = 1;
  return vec.map((v) => v / n);
}

// naive retry (handles 429)
async function embed(texts: string[]): Promise<number[][]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not configured");

  const payload = { model: MODEL, input: texts };

  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const j = (await res.json()) as { data: Array<{ embedding: number[] }> };
      return j.data.map((d) => d.embedding);
    }

    if (res.status !== 429) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Embeddings failed (${res.status}) ${txt}`);
    }
    await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
  }
  throw new Error("Embeddings failed after retries");
}

function toEmbedText(row: any): string {
  const parts = [
    row.title ?? "",
    row.dek ?? "",
    row.what ?? "",
    row.how ?? "",
    row.why ?? "",
    row.life_lesson ?? row.lifeLesson ?? "",
  ]
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean);

  const text = parts.join("\n\n").slice(0, 8000);
  return text.length ? text : (row.title ?? "");
}

async function assertAdmin() {
  const sb = supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return false;

  try {
    const { data, error } = await sb.rpc("is_admin").single();
    if (!error && (data as unknown as boolean) === true) return true;
  } catch {
    /* ignore */
  }

  // fallbacks
  const { data: a } = await sb.from("admins" as any).select("user_id").eq("user_id", user.id).maybeSingle();
  if (a) return true;

  const { data: p } = await sb.from("profiles" as any).select("role").eq("id", user.id).maybeSingle();
  return p?.role === "admin" || p?.role === "owner";
}

export async function POST(req: Request) {
  try {
    // AuthZ
    if (!(await assertAdmin())) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const svc = requireSupabaseService();

    // Parse limit & flags
    const url = new URL(req.url);
    const rawLimit = Number(url.searchParams.get("limit"));
    const limit = Math.min(200, Math.max(1, Number.isFinite(rawLimit) ? rawLimit : 50));
    const force = url.searchParams.get("force") === "true";

    // Select candidate rows
    const sel = svc
      .from("stories" as any)
      .select("id, title, dek, what, how, why, life_lesson, updated_at, embedding")
      .eq("is_published", true)
      .order("updated_at", { ascending: false })
      .limit(limit);

    const { data: rows, error: selErr } = force ? await sel : await sel.is("embedding", null);
    if (selErr) return NextResponse.json({ ok: false, error: selErr.message }, { status: 500 });

    if (!rows?.length) {
      return NextResponse.json({ ok: true, updated: 0, totalScanned: 0, note: "No candidates" });
    }

    // Build texts
    const texts = rows.map(toEmbedText);
    const payload = texts.map((t, i) => ({ i, t })).filter((x) => x.t.length > 0);
    if (!payload.length) {
      return NextResponse.json({ ok: true, updated: 0, totalScanned: rows.length, note: "No non-empty texts" });
    }

    // Embed in same order
    const vectors = await embed(payload.map((p) => p.t));

    // Map back and validate dims
    const updates: Array<{ id: string; embedding: number[] }> = [];
    let vi = 0;
    for (let pi = 0; pi < payload.length; pi++) {
      const v = vectors[vi++];
      if (Array.isArray(v) && v.length === DIMS) {
        // const vec = normalize(v); // <- enable if you want unit-norm
        const vec = v;
        const row = rows[payload[pi].i];
        updates.push({ id: row.id, embedding: vec });
      }
    }

    if (!updates.length) {
      return NextResponse.json({ ok: false, error: "No valid embeddings returned" }, { status: 500 });
    }

    // Upsert in small chunks
    const chunk = 96;
    let updated = 0;
    for (let i = 0; i < updates.length; i += chunk) {
      const slice = updates.slice(i, i + chunk);
      const { error } = await svc
        .from("stories" as any)
        .upsert(
          slice.map((u) => ({
            id: u.id,
            embedding: u.embedding as unknown as any,
            embedding_updated_at: new Date().toISOString(),
          })),
          { onConflict: "id" }
        );
      if (error) {
        return NextResponse.json({ ok: false, error: error.message, updated }, { status: 500 });
      }
      updated += slice.length;
    }

    return NextResponse.json({ ok: true, updated, totalScanned: rows.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
