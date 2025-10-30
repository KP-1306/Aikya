// app/api/admin/search/backfill/route.ts
import { NextResponse } from "next/server";
import { requireSupabaseService } from "@/lib/supabase/service";

export const runtime = "nodejs";

const OPENAI_URL = "https://api.openai.com/v1/embeddings";
const MODEL = "text-embedding-3-small";
const DIMS = 1536;

// naive retry (429)
async function embed(texts: string[]): Promise<number[][]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return [];
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
      return j.data.map(d => d.embedding);
    }

    if (res.status !== 429) break;
    await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
  }
  return [];
}

function toEmbedText(row: any): string {
  // Keep concise and consistent; long bodies can be chunked later if needed
  const parts = [
    row.title ?? "",
    row.dek ?? "",
    row.what ?? "",
    row.how ?? "",
    row.why ?? "",
    row.life_lesson ?? row.lifeLesson ?? "",
  ]
    .map(s => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean);
  const text = parts.join("\n\n").slice(0, 8000); // safety cutoff
  return text.length ? text : row.title ?? "";
}

export async function POST(req: Request) {
  const svc = requireSupabaseService();

  const url = new URL(req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50), 1), 200);
  const force = url.searchParams.get("force") === "true";

  // select candidate rows
  const sel = svc
    .from("stories")
    .select("id, title, dek, what, how, why, life_lesson, updated_at, embedding")
    .eq("is_published", true)
    .order("updated_at", { ascending: false })
    .limit(limit);

  const { data: rows, error: selErr } = force ? await sel : await sel.is("embedding", null);

  if (selErr) {
    return NextResponse.json({ ok: false, error: selErr.message }, { status: 500 });
  }
  if (!rows?.length) {
    return NextResponse.json({ ok: true, updated: 0, note: "No candidates" });
  }

  const texts = rows.map(toEmbedText).map(t => t || "");
  // Skip totally empty
  const payload = texts.map((t, i) => ({ i, t })).filter(x => x.t.length > 0);

  if (payload.length === 0) {
    return NextResponse.json({ ok: true, updated: 0, note: "No non-empty texts" });
  }

  // Embed in the same ordering
  const vectors = await embed(payload.map(p => p.t));
  if (!vectors.length) {
    return NextResponse.json({ ok: false, error: "Embedding call failed" }, { status: 500 });
  }

  // Map back to ids
  const updates: Array<{ id: string; embedding: number[] }> = [];
  let vi = 0;
  for (let pi = 0; pi < payload.length; pi++) {
    const v = vectors[vi++];
    if (Array.isArray(v) && v.length === DIMS) {
      const row = rows[payload[pi].i];
      updates.push({ id: row.id, embedding: v });
    }
  }

  // Upsert in small chunks to avoid payload limits
  const chunk = 100;
  let updated = 0;
  for (let i = 0; i < updates.length; i += chunk) {
    const slice = updates.slice(i, i + chunk);
    const { error } = await svc
      .from("stories")
      .upsert(
        slice.map(u => ({
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
}
