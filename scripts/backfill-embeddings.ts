// scripts/backfill-embeddings.ts
/**
 * ts-node scripts/backfill-embeddings.ts
 * or: node -r esbuild-register scripts/backfill-embeddings.ts
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const OPENAI_URL = "https://api.openai.com/v1/embeddings";
const MODEL = "text-embedding-3-small";
const DIMS = 1536;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openai = process.env.OPENAI_API_KEY!;

if (!url || !service) {
  console.error("Missing Supabase env (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  process.exit(1);
}
if (!openai) {
  console.error("Missing OPENAI_API_KEY");
  process.exit(1);
}

const sb = createClient(url, service, { auth: { persistSession: false } });

const BATCH_SIZE = Number(process.env.EMBED_BATCH_SIZE ?? 100);
const MAX_ROWS = Number(process.env.EMBED_MAX_ROWS ?? 5000);

function toText(row: any) {
  const parts = [
    row.title ?? "",
    row.dek ?? "",
    row.what ?? "",
    row.how ?? "",
    row.why ?? "",
    row.life_lesson ?? "",
  ]
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean);
  return parts.join("\n\n").slice(0, 8000) || row.title || "";
}

async function embedMany(texts: string[]): Promise<number[][]> {
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${openai}` },
    body: JSON.stringify({ model: MODEL, input: texts }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const j = (await res.json()) as { data: Array<{ embedding: number[] }> };
  return j.data.map((d) => d.embedding);
}

async function main() {
  let done = 0;

  while (done < MAX_ROWS) {
    const { data: rows, error } = await sb
      .from("stories")
      .select("id, title, dek, what, how, why, life_lesson")
      .eq("is_published", true)
      .is("embedding", null)
      .order("updated_at", { ascending: false })
      .limit(BATCH_SIZE);

    if (error) throw error;
    if (!rows?.length) break;

    const inputs = rows.map(toText).map((t) => t || "");
    const validPairs = rows.map((r, i) => ({ r, i })).filter((x) => inputs[x.i].length > 0);
    if (!validPairs.length) break;

    const vectors = await embedMany(validPairs.map((p) => inputs[p.i]));
    const updates = validPairs
      .map((vp, idx) => ({ id: vp.r.id, v: vectors[idx] }))
      .filter((u) => Array.isArray(u.v) && u.v.length === DIMS);

    const { error: upErr } = await sb.from("stories").upsert(
      updates.map((u) => ({
        id: u.id,
        embedding: u.v as unknown as any,
        embedding_updated_at: new Date().toISOString(),
      })),
      { onConflict: "id" }
    );
    if (upErr) throw upErr;

    done += rows.length;
    console.log(`Embedded batch: +${updates.length} (scanned ${rows.length}) total=${done}`);
    if (rows.length < BATCH_SIZE) break;
  }

  console.log("Backfill complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
