// lib/data.ts
import { supabaseServer } from "./supabase/server";

export type Story = {
  id: string;
  slug: string;
  title: string;
  dek: string;
  life_lesson: string;
  category: "ActsOfKindness" | "BraveryRescue" | "Innovation" | "Environment" | "GlobalHope" | "Wisdom";
  city: string | null;
  state: string | null;
  country: string;
  read_minutes: number;
  published_at: string; // ISO
  hero_image: string | null;
  video_url: string | null;
  what: string;
  how: string;
  why: string;
  is_published: boolean;
};

const STORY_COLUMNS =
  "id, slug, title, dek, life_lesson, category, city, state, country, read_minutes, published_at, hero_image, video_url, what, how, why, is_published";

export async function getStories(opts: {
  state?: string;
  category?: string;
  limit?: number;
  page?: number; // 1-based
} = {}) {
  const sb = supabaseServer();

  let q = sb
    .from("stories")
    .select(STORY_COLUMNS)
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (opts.state) q = q.eq("state", opts.state);
  if (opts.category) q = q.eq("category", opts.category);

  // Pagination (optional)
  const limit = opts.limit ?? 24;
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error } = await q.range(from, to);
  if (error) throw new Error(`getStories failed: ${error.message}`);
  return (data ?? []) as Story[];
}

export async function getStoryBySlug(slug: string) {
  const sb = supabaseServer();

  const { data, error } = await sb
    .from("stories")
    .select(STORY_COLUMNS)
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error) throw new Error(`getStoryBySlug failed: ${error.message}`);

  // fetch sources separately (keeps schema simple)
  const { data: sources, error: srcErr } = await sb
    .from("sources")
    .select("name, url")
    .eq("story_id", data.id);

  if (srcErr) throw new Error(`getStoryBySlug sources failed: ${srcErr.message}`);

  return { ...(data as Story), sources: sources ?? [] };
}
