// lib/recs.ts
import { supabaseServer } from "@/lib/supabase/server";

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
};

/** Anything with an `id` can be merged here */
type WithId = { id: string | number };

/**
 * Merge two lists (primary first) while de-duplicating by `id`,
 * then cap the result at `limit`. Works with any item type that
 * includes an `id` field.
 */
export function mergeRecs<T extends WithId>(
  primary?: T[] | null,
  popular?: T[] | null,
  limit: number = 24
): T[] {
  const seen = new Set<string | number>((primary ?? []).map((s: T) => s.id));
  const merged: T[] = [
    ...(primary ?? []),
    ...((popular ?? []).filter((s: T) => !seen.has(s.id)) as T[]),
  ].slice(0, limit);
  return merged;
}

/**
 * Simple recommendations:
 * 1) Recent stories, optionally filtered to the user's state
 * 2) If we don't have enough, append globally-popular (last 30d) via RPC
 */
export async function getRecommendations(opts: {
  userId?: string;
  state?: string;
  limit?: number;
} = {}): Promise<StoryRow[]> {
  const sb = supabaseServer();
  const limit = opts.limit ?? 6;

  // 1) Prefer user’s state (recent, published)
  let q = sb
    .from("stories")
    .select<StoryRow>(
      "id, slug, title, hero_image, city, state, is_published, published_at"
    )
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (opts.state) q = q.eq("state", opts.state);

  const { data: primary } = await q;

  // If we already have enough, return
  if ((primary?.length ?? 0) >= limit) return primary ?? [];

  // 2) Fallback: globally-popular last 30 days (by likes+saves/views)
  // Expect your SQL RPC `popular_stories_last_30d(p_limit integer)` to return the same columns as StoryRow
  const { data: popular } = await sb.rpc("popular_stories_last_30d", {
    p_limit: limit,
  });

  return mergeRecs<StoryRow>(primary ?? [], (popular as StoryRow[]) ?? [], limit);
}
