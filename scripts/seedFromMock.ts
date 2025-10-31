// scripts/seedFromMock.ts
import { createClient } from "@supabase/supabase-js";

// Adjust the relative path if your file lives elsewhere
import { stories as mock } from "../lib/mock";

// Environment (Netlify has SUPABASE_SERVICE_ROLE_KEY)
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE ||
  process.env.SUPABASE_SERVICE_ROLE_KEY_OLD || // fallback if you had an older var
  "";

if (!url || !serviceKey) {
  // Fail fast at build if env is missing
  throw new Error(
    "[seedFromMock] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env."
  );
}

const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

// Map mock → DB row (snake_case)
function toDb(s: any) {
  return {
    // id (omit → let DB default / uuid generate)
    slug: s.slug,
    title: s.title,
    dek: s.dek ?? null,
    life_lesson: s.lifeLesson ?? s.life_lesson ?? null,
    category: s.category ?? null,
    city: s.city ?? null,
    state: s.state ?? null,
    country: s.country ?? null,
    read_minutes: s.readMinutes ?? s.read_minutes ?? null,
    published_at: s.publishedAt ?? s.published_at ?? null,
    hero_image: s.heroImage ?? s.hero_image ?? null,
    video_url: s.videoUrl ?? s.video_url ?? null,
    what: s.what ?? null,
    how: s.how ?? null,
    why: s.why ?? null,
    is_published: s.is_published ?? true,
    // created_at handled by DB default
    // deleted_at remains null
  };
}

async function main() {
  // (A) Optionally ensure a unique index for sources; ignore if you don’t have exec_sql
  try {
    await sb.rpc("exec_sql", {
      sql: `
      create table if not exists public.sources(
        id uuid primary key default gen_random_uuid(),
        story_id uuid not null references public.stories(id) on delete cascade,
        name text,
        url text not null
      );
      create unique index if not exists sources_story_url_uidx
        on public.sources(story_id, url);
    `,
    });
  } catch {
    // If you don't have the exec_sql function deployed, just skip silently.
  }

  // (B) Upsert stories by slug
  const rows = mock.map(toDb);

  const { data: upserted, error: upErr } = await sb
    .from("stories")
    .upsert(rows, { onConflict: "slug", ignoreDuplicates: false })
    .select("id, slug");

  if (upErr) {
    throw new Error("[seedFromMock] stories upsert failed: " + upErr.message);
  }

  // Build a lookup by slug → id
  const bySlug = new Map<string, string>();
  for (const r of upserted ?? []) {
    bySlug.set(r.slug, r.id);
  }

  // (C) Prepare sources rows (handle string[] and {name,url}[])
  type SrcRow = { story_id: string; name: string | null; url: string };
  const srcRows: SrcRow[] = [];

  for (const m of mock) {
    const storyId = bySlug.get(m.slug);
    if (!storyId) continue;

    const sources = m.sources ?? [];
    for (const src of sources) {
      if (typeof src === "string") {
        srcRows.push({
          story_id: storyId,
          name: null,
          url: src,
        });
      } else if (src && typeof src === "object" && src.url) {
        srcRows.push({
          story_id: storyId,
          name: src.name ?? null,
          url: src.url,
        });
      }
    }
  }

  if (srcRows.length > 0) {
    // Prefer upsert with composite conflict target if available
    const { error: srcErr } = await sb
      .from("sources")
      .upsert(srcRows, { onConflict: "story_id,url", ignoreDuplicates: false });

    // If your Postgres doesn’t allow composite onConflict via PostgREST,
    // you can fall back to ignoreDuplicates (may allow dupes across story_id).
    if (srcErr) {
      const { error: insErr } = await sb
        .from("sources")
        .insert(srcRows, { ignoreDuplicates: true });
      if (insErr) {
        throw new Error("[seedFromMock] sources insert failed: " + insErr.message);
      }
    }
  }

  // Done
  console.log(
    `[seedFromMock] Seed complete — stories: ${(upserted ?? []).length}, sources: ${srcRows.length}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
