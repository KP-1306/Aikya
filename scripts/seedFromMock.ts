// scripts/seedFromMock.ts
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { stories as mock } from "../lib/mock";

type DBStory = {
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
  published_at: string | null;
  hero_image: string | null;
  video_url: string | null;
  what: string | null;
  how: string | null;
  why: string | null;
  is_published: boolean;
};

function toDb(s: (typeof mock)[number]): DBStory {
  return {
    slug: s.slug,
    title: s.title,
    dek: s.dek ?? null,
    life_lesson: s.lifeLesson ?? null,
    category: s.category,
    city: s.city ?? null,
    state: s.state ?? null,
    country: s.country ?? null,
    read_minutes: s.readMinutes ?? null,
    published_at: s.publishedAt ?? null,
    hero_image: s.heroImage ?? null,
    video_url: s.videoUrl ?? null,
    what: s.what ?? null,
    how: s.how ?? null,
    why: s.why ?? null,
    is_published: true, // seed as published
  };
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // server-side only
  if (!url || !serviceKey) {
    throw new Error("Missing SUPABASE envs");
  }

  const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

  // helpful indexes (idempotent)
  await sb.rpc("sql", {
    q: `
      create unique index if not exists stories_slug_uidx on public.stories(slug);
      create unique index if not exists sources_story_url_uidx on public.sources(story_id, url);
    `,
  }).catch(() => void 0);

  // upsert stories
  const rows = mock.map(toDb);
  const { data: up, error } = await sb
    .from("stories")
    .upsert(rows, { onConflict: "slug" })
    .select("id, slug");
  if (error) throw error;

  // map slug -> id
  const idBySlug = new Map(up.map((r: any) => [r.slug, r.id]));

  // upsert sources (skip if none)
  const sourceRows =
    mock.flatMap((s) =>
      (s.sources ?? []).map((src) => ({
        story_id: idBySlug.get(s.slug),
        name: src.name ?? new URL(src.url).hostname,
        url: src.url,
      })),
    ).filter((r) => !!r.story_id);

  if (sourceRows.length) {
    const { error: sErr } = await sb
      .from("sources")
      .upsert(sourceRows as any, { onConflict: "story_id,url" });
    if (sErr) throw sErr;
  }

  console.log(`Seeded ${rows.length} stories, ${sourceRows.length} sources ✅`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
