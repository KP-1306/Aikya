// lib/data.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/* ---------- Types ---------- */
export type Story = {
  id: string;
  slug: string;
  title: string;
  dek: string | null;
  life_lesson: string | null;
  category: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  read_minutes: number | null;
  published_at: string | null;
  created_at: string | null;
  hero_image: string | null;
  video_url: string | null;
  what: string | null;
  how: string | null;
  why: string | null;
  is_published: boolean;
};

export type SourceLink = { name: string | null; url: string };

/* ---------- Column list ---------- */
const STORY_COLUMNS =
  "id, slug, title, dek, life_lesson, category, city, state, country, read_minutes, published_at, created_at, hero_image, video_url, what, how, why, is_published";

/* ---------- Helpers ---------- */
function getSbOrNull(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createClient(url, anon, { auth: { persistSession: false } });
}

async function loadMock() {
  // expect: export const stories = [...]
  // mock schema keys: id, slug, title, dek, lifeLesson, category, city, state, country,
  // readMinutes, publishedAt, heroImage, videoUrl, what, how, why, sources?
  return import("./mock");
}

function mapMockToStory(m: any): Story {
  return {
    id: m.id,
    slug: m.slug,
    title: m.title,
    dek: m.dek ?? null,
    life_lesson: m.lifeLesson ?? m.life_lesson ?? null,
    category: m.category ?? null,
    city: m.city ?? null,
    state: m.state ?? null,
    country: m.country ?? null,
    read_minutes: m.readMinutes ?? m.read_minutes ?? null,
    published_at: m.publishedAt ?? m.published_at ?? null,
    created_at: (m.publishedAt ?? m.published_at) ?? null,
    hero_image: m.heroImage ?? m.hero_image ?? null,
    video_url: m.videoUrl ?? m.video_url ?? null,
    what: m.what ?? null,
    how: m.how ?? null,
    why: m.why ?? null,
    is_published: true,
  };
}

/* ---------- API ---------- */
export async function getStories(opts: {
  city?: string;
  state?: string;
  category?: string;
  limit?: number;
  page?: number;
} = {}): Promise<Story[]> {
  const sb = getSbOrNull();

  // If Supabase env is missing, fall back to mock immediately
  if (!sb) {
    const mock = await loadMock();
    return (mock.stories ?? []).map(mapMockToStory);
  }

  try {
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

    if (!error && rows.length > 0) return rows;
  } catch {
    // swallow and fall through to mock
  }

  // DEV/empty fallback → mock
  const mock = await loadMock();
  return (mock.stories ?? []).map(mapMockToStory);
}

export async function getStoryBySlug(
  slug: string
): Promise<Story & { sources: SourceLink[] }> {
  const sb = getSbOrNull();

  if (sb) {
    try {
      const { data, error } = await sb
        .from("stories")
        .select(STORY_COLUMNS)
        .eq("slug", slug)
        .eq("is_published", true)
        .is("deleted_at", null)
        .single();

      if (!error && data) {
        const { data: sourcesData } = await sb
          .from("sources")
          .select("name, url")
          .eq("story_id", (data as any).id);

        return { ...(data as Story), sources: (sourcesData ?? []) as SourceLink[] };
      }
    } catch {
      // fall through to mock
    }
  }

  // Mock fallback for single story
  const mock = await loadMock();
  const m = (mock.stories ?? []).find((s: any) => s.slug === slug);
  if (!m) {
    // keep this non-fatal in SSR contexts if you prefer:
    // return { ...(empty stub), sources: [] }
    throw new Error("Story not found");
  }

  const story = mapMockToStory(m);
  const sources: SourceLink[] = (m.sources ?? [])
    .map((s: any) =>
      typeof s === "string"
        ? ({ name: null, url: s } as SourceLink)
        : ({ name: s?.name ?? null, url: s?.url } as SourceLink)
    )
    .filter((s: SourceLink) => !!s.url);

  return { ...story, sources };
}
