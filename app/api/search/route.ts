// app/api/search/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const runtime = "nodejs";

// --- Supabase (public client; we only read published rows) ---
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
function sb() {
  return createClient(SB_URL, SB_ANON, { auth: { persistSession: false } });
}

// --- OpenAI (optional) ---
const hasOpenAI = !!process.env.OPENAI_API_KEY;
const openai = hasOpenAI ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY! }) : null;

// --- Limits / helpers ---
const DEFAULT_K = 12;
const MAX_K = 24;

function clampK(v: unknown): number {
  const n = Number(v ?? DEFAULT_K);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_K;
  return Math.min(Math.max(1, Math.trunc(n)), MAX_K);
}
function sanitizeQuery(q: unknown): string {
  if (typeof q !== "string") return "";
  return q.replace(/[\u0000-\u001F\u007F]+/g, " ").trim();
}

// --- Types ---
type StoryRow = {
  id: string;
  slug: string;
  title: string;
  dek: string | null;
  city: string | null;
  state: string | null;
  hero_image: string | null;
  read_minutes: number | null;
};

// --- Semantic search (try both RPC names) ---
async function vectorSearch(query: string, k: number) {
  if (!openai) return { data: null as StoryRow[] | null, error: null as string | null };

  try {
    const emb = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });
    const embedding = emb.data[0].embedding;

    // Try RPC: semantic_search_stories
    const s = sb();
    let { data, error } = await s.rpc("semantic_search_stories", {
      query_embedding: embedding as any,
      match_count: k,
    });

    // If that RPC name doesn't exist, try search_stories_by_embedding
    if (error || !Array.isArray(data)) {
      const alt = await s.rpc("search_stories_by_embedding", {
        query_embedding: embedding as any,
        match_count: k,
      });
      data = alt.data as any;
      error = alt.error as any;
    }

    if (error) return { data: null, error: error.message };
    if (!Array.isArray(data)) return { data: [], error: null };

    // Ensure consistent shape
    const rows: StoryRow[] = data.map((r: any) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      dek: r.dek ?? null,
      city: r.city ?? null,
      state: r.state ?? null,
      hero_image: r.hero_image ?? null,
      read_minutes: r.read_minutes ?? null,
    }));

    return { data: rows, error: null };
  } catch (e: any) {
    // graceful fallback
    return { data: null, error: e?.message ?? "embedding_failed" };
  }
}

// --- Text fallback (ILIKE) ---
async function textSearch(q: string, k: number) {
  const like = `%${q}%`;
  const s = sb();
  const { data, error } = await s
    .from("stories")
    .select("id, slug, title, dek, city, state, hero_image, read_minutes, published_at")
    .eq("is_published", true)
    .or(
      [
        `title.ilike.${like}`,
        `dek.ilike.${like}`,
        `what.ilike.${like}`,
        `why.ilike.${like}`,
        `how.ilike.${like}`,
        `city.ilike.${like}`,
        `state.ilike.${like}`,
      ].join(",")
    )
    .order("published_at", { ascending: false })
    .limit(k);

  if (error) return { data: null as StoryRow[] | null, error: error.message };
  const rows: StoryRow[] = (data || []).map((r: any) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    dek: r.dek ?? null,
    city: r.city ?? null,
    state: r.state ?? null,
    hero_image: r.hero_image ?? null,
    read_minutes: r.read_minutes ?? null,
  }));
  return { data: rows, error: null };
}

// --- Core worker ---
async function handleSearch(q: string, k: number) {
  // 1) Try semantic first (if OpenAI available)
  const vec = await vectorSearch(q, k);
  if (Array.isArray(vec.data)) {
    return NextResponse.json({ data: vec.data, mode: "vector", error: null });
  }

  // 2) Fallback to text
  const txt = await textSearch(q, k);
  if (txt.error) {
    return NextResponse.json({ data: [], mode: "text", error: txt.error }, { status: 500 });
  }
  return NextResponse.json({ data: txt.data ?? [], mode: "text", error: null });
}

// --- POST: { q, k? } ---
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { q?: unknown; k?: unknown };
    const q = sanitizeQuery(body.q);
    const k = clampK(body.k);
    if (!q) return NextResponse.json({ data: [], error: "Empty query" }, { status: 400 });
    return handleSearch(q, k);
  } catch (e: any) {
    return NextResponse.json({ data: [], error: e?.message ?? "Search failed" }, { status: 500 });
  }
}

// --- GET: ?q=&limit= ---
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = sanitizeQuery(searchParams.get("q"));
  const k = clampK(searchParams.get("limit"));
  if (!q) return NextResponse.json({ data: [], error: "Empty query" }, { status: 400 });
  return handleSearch(q, k);
}
