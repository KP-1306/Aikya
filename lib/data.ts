// lib/data.ts
import { supabaseServer } from "./supabase/server";
export type Story = { /* …your existing type… */ };

const STORY_COLUMNS =
  "id, slug, title, dek, life_lesson, category, city, state, country, read_minutes, published_at, created_at, hero_image, video_url, what, how, why, is_published";

export async function getStories(opts: {
  city?: string;
  state?: string;
  category?: string;
  limit?: number;
  page?: number;
} = {}): Promise<Story[]> {
  const sb = supabaseServer();

  let q = sb
    .from("stories")
    .select(STORY_COLUMNS)
    .eq("is_published", true)
    .is("deleted_at", null)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (opts.city) q = q.eq("city", opts.city);
  else if (opts.state) q = q.eq("state", opts.state);
  if (opts.category) q = q.eq("category", opts.category);

  const limit = Math.max(1, opts.limit ?? 24);
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error } = await q.range(from, to);
  const rows = (data ?? []) as Story[];

  // If DB returned rows, use them
  if (!error && rows.length > 0) return rows;

  // ---- DEV FALLBACK to ./mock.ts when DB is empty ----
  // (You can gate this with NODE_ENV if you want)
  const mock = await import("./mock");
  return mock.stories.map((s) => ({
    id: s.id,
    slug: s.slug,
    title: s.title,
    dek: s.dek,
    life_lesson: s.lifeLesson,
    category: s.category,
    city: s.city ?? null,
    state: s.state ?? null,
    country: s.country ?? null,
    read_minutes: s.readMinutes,
    published_at: s.publishedAt,
    created_at: s.publishedAt,
    hero_image: s.heroImage ?? null,
    video_url: s.videoUrl ?? null,
    what: s.what ?? null,
    how: s.how ?? null,
    why: s.why ?? null,
    is_published: true,
  })) as Story[];
}

export async function getStoryBySlug(slug: string) {
  const sb = supabaseServer();

  const { data, error } = await sb
    .from("stories")
    .select(STORY_COLUMNS)
    .eq("slug", slug)
    .eq("is_published", true)
    .is("deleted_at", null)
    .single();

  if (!error && data) {
    const { data: sources } = await sb
      .from("sources")
      .select("name, url")
      .eq("story_id", data.id);
    return { ...(data as Story), sources: sources ?? [] };
  }

  // ---- DEV FALLBACK for single story ----
  const mock = await import("./mock");
  const m = mock.stories.find((s) => s.slug === slug);
  if (!m) throw new Error("Story not found");

  return {
    id: m.id,
    slug: m.slug,
    title: m.title,
    dek: m.dek,
    life_lesson: m.lifeLesson,
    category: m.category,
    city: m.city ?? null,
    state: m.state ?? null,
    country: m.country ?? null,
    read_minutes: m.readMinutes,
    published_at: m.publishedAt,
    created_at: m.publishedAt,
    hero_image: m.heroImage ?? null,
    video_url: m.videoUrl ?? null,
    what: m.what ?? null,
    how: m.how ?? null,
    why: m.why ?? null,
    is_published: true,
    sources: m.sources ?? [],
  };
}
