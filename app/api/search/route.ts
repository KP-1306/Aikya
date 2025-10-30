// app/api/search/route.ts
import { NextResponse } from "next/server";
import { requireSupabaseService } from "@/lib/supabase/service";

/**
 * Runtime note:
 * We use the Node runtime so we can safely call external APIs without Edge crypto constraints.
 * Keep this aligned with your other server routes (e.g., certificates API).
 */
export const runtime = "nodejs";

// --- Config ---
const DEFAULT_K = 10;
const MAX_K = 25;

// --- Helpers ---
function clampK(v: unknown): number {
  const n = Number(v ?? DEFAULT_K);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_K;
  return Math.min(Math.max(1, Math.trunc(n)), MAX_K);
}

function sanitizeQuery(q: unknown): string {
  if (typeof q !== "string") return "";
  // strip control chars and trim
  return q.replace(/[\u0000-\u001F\u007F]+/g, " ").trim();
}

async function embedWithOpenAI(query: string): Promise<number[] | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  // Use fetch to avoid bundling SDKs and keep the route lean
  const resp = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: query,
    }),
  });

  if (!resp.ok) {
    // Do not throw—gracefully fall back to text search
    return null;
  }

  const json = (await resp.json()) as {
    data?: Array<{ embedding: number[] }>;
  };

  const emb = json?.data?.[0]?.embedding;
  return Array.isArray(emb) ? emb : null;
}

async function textSearch(supa: ReturnType<typeof requireSupabaseService>, q: string, k: number) {
  // Basic, fast fallback using ILIKE on title/dek; keeps search functional without OpenAI
  return supa
    .from("stories")
    .select("id, slug, title, dek, hero_image, state, city, published_at")
    .eq("is_published", true)
    .or(`title.ilike.%${q}%,dek.ilike.%${q}%`)
    .order("published_at", { ascending: false })
    .limit(k);
}

async function vectorSearch(
  supa: ReturnType<typeof requireSupabaseService>,
  embedding: number[],
  k: number
) {
  // RPC defined in your snapshot:
  // search_stories_by_embedding(query_embedding vector, match_count int)
  return supa.rpc("search_stories_by_embedding", {
    query_embedding: embedding,
    match_count: k,
  });
}

// --- Core handler (POST body: { q, k? }) ---
export async function POST(req: Request) {
  try {
    const supa = requireSupabaseService();

    const { q: rawQ, k: rawK } =
      (await req.json().catch(() => ({}))) as { q?: unknown; k?: unknown };

    const q = sanitizeQuery(rawQ);
    const k = clampK(rawK);

    if (!q) {
      return NextResponse.json({ data: [], error: "Empty query" }, { status: 400 });
    }

    // Try semantic first (only if OPENAI key is present and embedding succeeds)
    const embedding = await embedWithOpenAI(q);

    if (embedding) {
      const { data, error } = await vectorSearch(supa, embedding, k);
      if (!error && Array.isArray(data)) {
        return NextResponse.json({ data, mode: "vector", error: null });
      }
      // Fall through to text search if RPC had issues
    }

    // Fallback: simple text search
    const { data, error } = await textSearch(supa, q, k);
    if (error) {
      return NextResponse.json({ data: [], error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data: data ?? [], mode: "text", error: null });
  } catch (e: any) {
    return NextResponse.json(
      { data: [], error: e?.message ?? "Search failed" },
      { status: 500 }
    );
  }
}

// --- Back-compat GET (?q=&limit=) ---
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = sanitizeQuery(searchParams.get("q"));
  const k = clampK(searchParams.get("limit"));

  // Reuse the POST handler logic by crafting a Request with a JSON body
  const body = JSON.stringify({ q, k });
  const fakePost = new Request(req.url, { method: "POST", body, headers: req.headers });
  return POST(fakePost);
}
