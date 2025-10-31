// lib/recs.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/** Shape we need from `stories` for cards/recs */
export type StoryRow = {
  id: string;
  slug: string;
  title: string;
  hero_image: string | null;
  city: string | null;
  state: string | null;
  is_published: boolean;
  published_at: string | null;
  like_count?: number | null; // optional; used in fallback popularity sort
};

/** Anything with an `id` can be merged here */
type WithId = { id: string | number };

/** Merge 2 lists (primary first), de-dupe by `id`, cap at limit */
export function mergeRecs<T extends WithId>(
  primary?: T[] | null,
  popular?: T[] | null,
  limit: number = 24
): T[] {
  const out: T[] = [];
  const seen = new Set<string | number>();
  for (const arr of [primary ?? [], popular ?? []]) {
    for (const item of arr) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
      if (out.length >= limit) return out;
    }
  }
  return out;
}

/* ------------ internal helpers ------------ */
function getSbOrNull(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createClient(url, anon, { auth: { persistSession: false } });
}

/**
 * Simple recommendations:
 * 1) Recent stories, optionally filtered to the user's state
 * 2) If not enough, try globally-popular via RPC; if RPC is missing,
 *    fall back to a popularity-ish query (like_count desc, then recent)
 */
export async function getRecommendations(opts: {
  userId?: string | null;
  state?: string | null;
  limit?: number;
} = {}): Promise<StoryRow[]> {
  const sb = getSbOrNull();
  const limit = opts.limit ?? 6;

  if (!sb) return []; // no env → safe empty recs

  // 1) recent (optionally state-scoped)
  let q = sb
    .from("stories")
    .select(
      "id, slug, title, hero_image, city, state, is_published, published_at, like_count"
    )
    .eq("is_published", true)
    .is("deleted_at", null)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (opts.state) q = q.eq("state", opts.state);

  const { data: primaryData } = await q;
  const primary = (primaryData ?? []) as StoryRow[];

  if (primary.length >= limit) return primary;

  // 2a) try RPC (if present)
  let popular: StoryRow[] = [];
  try {
    const { data: rpc } = await sb.rpc("popular_stories_last_30d", {
      p_limit: limit,
    });
    popular = (rpc ?? []) as StoryRow[];
  } catch {
    // ignore; RPC might not exist in this environment
  }

  // 2b) fallback popularity query if RPC produced nothing
  if (popular.length === 0) {
    const { data: popQ } = await sb
      .from("stories")
      .select(
        "id, slug, title, hero_image, city, state, is_published, published_at, like_count"
      )
      .eq("is_published", true)
      .is("deleted_at", null)
      .gte("published_at", new Date(Date.now() - 30 * 864e5).toISOString())
      .order("like_count", { ascending: false, nullsFirst: false })
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(limit);
    popular = (popQ ?? []) as StoryRow[];
  }

  return mergeRecs<StoryRow>(primary, popular, limit);
}
