// app/api/admin/embeddings/backfill/route.ts
import { NextResponse } from "next/server";
import { requireSupabaseService } from "@/lib/supabase/service";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function isAdmin(): Promise<boolean> {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return false;
  try {
    const { data } = await sb.rpc("is_admin").single();
    if (data === true) return true;
  } catch {}
  const { data: prof } = await sb.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return prof?.role === "admin";
}

function normalize(vec: number[]): number[] {
  let norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  if (!norm || !isFinite(norm)) norm = 1;
  return vec.map((v) => v / norm);
}

async function embed(text: string): Promise<number[] | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const resp = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text }),
  });
  if (!resp.ok) return null;
  const json = (await resp.json()) as { data?: Array<{ embedding: number[] }> };
  const emb = json?.data?.[0]?.embedding;
  if (!Array.isArray(emb)) return null;
  return normalize(emb);
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const svc = requireSupabaseService();

  // Batch size & cursor
  const { batch = 20 } = (await req.json().catch(() => ({}))) as { batch?: number };

  // Pull published stories missing embeddings
  const { data: rows, error } = await svc
    .from("stories")
    .select("id, title, dek, what, how, why")
    .eq("is_published", true)
    .is("deleted_at", null)
    .is("embedding", null)
    .order("published_at", { ascending: false })
    .limit(Math.min(Math.max(1, batch), 100));

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!rows || rows.length === 0) return NextResponse.json({ done: true, processed: 0 });

  let processed = 0;
  const failures: string[] = [];

  for (const r of rows) {
    // Compose a good embedding text (title + dek + what/how/why)
    const text = [
      r.title ?? "",
      r.dek ?? "",
      r.what ?? "",
      r.how ?? "",
      r.why ?? "",
    ]
      .join("\n")
      .trim();

    const vec = await embed(text);
    if (!vec) {
      failures.push(r.id);
      continue;
    }

    // Store normalized vector
    const { error: upErr } = await svc.rpc("set_story_embedding", {
      p_id: r.id,
      p_embedding: vec as unknown as number[], // Supabase maps float8[] to vector
    });
    if (upErr) {
      failures.push(r.id);
      continue;
    }
    processed++;
  }

  return NextResponse.json({ processed, failures, remainingHint: "Re-run until done." });
}
