// app/api/embeddings/rebuild/route.ts
import { NextResponse } from "next/server";
import { requireSupabaseService } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function joinText(s: any) {
  return [s.title, s.dek, s.what, s.how, s.why, JSON.stringify(s.sources ?? null)]
    .filter(Boolean)
    .join("\n")
    .slice(0, 8000);
}

function unitNorm(vec: number[]) {
  const n = Math.sqrt(vec.reduce((acc, v) => acc + v * v, 0)) || 1;
  return vec.map((v) => v / n);
}

async function columnExists(svc: any, table: string, col: string) {
  const { data, error } = await svc
    .rpc("pg_table_def", { p_table: table }) // if you don’t have this RPC, we’ll fall back to trying an update
    .catch(() => ({ data: null, error: null }));
  if (data && Array.isArray(data)) {
    return data.some((r: any) => r.column_name === col);
  }
  // Fallback probe: try a harmless select with the column
  const probe = await svc.from(table).select(`id, ${col}`).limit(1);
  return !probe.error;
}

export async function POST() {
  try {
    // Don’t break build/runtime if the key is absent
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { ok: false, skipped: true, reason: "OPENAI_API_KEY not set" },
        { status: 200 }
      );
    }

    // Lazy import: avoids eval at build time
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    // Service client (reads env internally)
    const svc = requireSupabaseService();

    // Pull recent published stories that need embedding; adjust filter as you like
    const { data: stories, error } = await svc
      .from("stories")
      .select("id, title, dek, what, how, why, sources, embedding")
      .eq("is_published", true)
      .is("deleted_at", null)
      .order("published_at", { ascending: false })
      .limit(200);
    if (error) throw error;

    if (!stories?.length) {
      return NextResponse.json({ ok: true, updated: 0, reason: "no stories" });
    }

    // Where to write? Prefer stories.embedding if present, else stories_embeddings table
    const hasInline = await columnExists(svc, "stories", "embedding");

    let updated = 0;
    for (const s of stories) {
      const text = joinText(s);
      if (!text) continue;

      const emb = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });

      const raw = emb.data[0]?.embedding ?? [];
      const vec = unitNorm(raw);

      if (hasInline) {
        // Write into stories.embedding (vector/JSON depending on your schema)
        const { error: upErr } = await svc
          .from("stories")
          .update({
            embedding: vec as unknown as any,
            embedding_updated_at: new Date().toISOString(),
          })
          .eq("id", s.id);
        if (upErr) throw upErr;
      } else {
        // Backward-compat: upsert to stories_embeddings (embedding stored as JSON/array)
        const { error: upErr } = await svc
          .from("stories_embeddings")
          .upsert({ story_id: s.id, embedding: vec as unknown as any }, { onConflict: "story_id" });
        if (upErr) throw upErr;
      }

      updated++;
    }

    return NextResponse.json({ ok: true, updated, target: hasInline ? "stories.embedding" : "stories_embeddings" });
  } catch (e: any) {
    // Don’t crash build; return error payload
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, info: "POST to rebuild embeddings." });
}
