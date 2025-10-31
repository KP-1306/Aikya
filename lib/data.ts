// lib/data.ts
import { supabaseServer } from "./supabase/server";

export type Story = {
  id: string;
  slug: string;
  title: string;
  dek: string | null;
  life_lesson: string | null;
  category:
    | "ActsOfKindness"
    | "BraveryRescue"
    | "Innovation"
    | "Environment"
    | "GlobalHope"
    | "Wisdom";
  city: string | null;
  state: string | null;
  country: string | null;
  read_minutes: number | null;
  published_at: string | null; // may be null for older entries
  created_at?: string | null;  // used for fallback ordering
  hero_image: string | null;
  video_url: string | null;
  what: string | null;
  how: string | null;
  why: string | null;
  is_published: boolean;
};

const STORY_COLUMNS =
  // include created_at for robust ordering (even if you don't render it)
  "id, slug, title, dek, life_lesson, category, city, state, country, read_minutes, published_at, created_at, hero_image, video_url, what, how, why, is_published";

/**
 * Fetch stories with optional city/state/category filters.
 * - Only returns published & non-deleted rows
 * - Orders by published_at desc (nulls last) then created_at desc (fallback)
 */
export async function getStories(opts: {
  city?: string;
  state?: string;
  category?: string;
  limit?: number;
  page?: number; // 1-based
} = {}): Promise<Story[]> {
  const sb = supabaseServer();

  try {
    let q = sb
      .from("stories")
      .select(STORY_COLUMNS)
      .eq("is_published", true)
      .is("deleted_at", null); // RLS + app-level safety

    // apply region filters only if provided
    if (opts.city) q = q.eq("city", opts.city);
    else if (opts.state) q = q.eq("state", opts.state);

    if (opts.category) q = q.eq("category", opts.category);

    // robust ordering: published first, newest first; then fallback to created_at
    q = q
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    const limit = Math.max(1, opts.limit ?? 24);
    const page = Math.max(1, opts.page ?? 1);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error } = await q.range(from, to);
    if (error) {
      console.error("[getStories] Supabase error:", error.message);
      return [];
    }
    return (data ?? []) as Story[];
  } catch (e: any) {
    console.error("[getStories] Unexpected error:", e?.message ?? e);
    return [];
  }
}

/**
 * Fetch a single story by slug with sources.
 * Only returns published & non-deleted stories.
 */
export async function getStoryBySlug(slug: string) {
  const sb = supabaseServer();

  // story
  const { data, error } = await sb
    .from("stories")
    .select(STORY_COLUMNS)
    .eq("slug", slug)
    .eq("is_published", true)
    .is("deleted_at", null)
    .single();

  if (error) throw new Error(`getStoryBySlug failed: ${error.message}`);

  // sources
  const { data: sources, error: srcErr } = await sb
    .from("sources")
    .select("name, url")
    .eq("story_id", data.id);

  if (srcErr) throw new Error(`getStoryBySlug sources failed: ${srcErr.message}`);

  return { ...(data as Story), sources: sources ?? [] };
}
