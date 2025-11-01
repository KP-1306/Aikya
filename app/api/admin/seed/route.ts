// app/api/admin/seed/route.ts
import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { stories as mock } from "@/lib/mock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --- helpers ---
function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 90);
}

async function ensureUniqueSlug(
  svc: SupabaseClient,
  baseline: string
): Promise<string> {
  let candidate = baseline;
  let i = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data } = await svc
      .from("stories" as any)
      .select("id")
      .eq("slug", candidate)
      .limit(1)
      .maybeSingle();
    if (!data) return candidate;
    candidate = `${baseline}-${i++}`;
  }
}

function sanitizeUrl(u?: string | null) {
  if (!u) return null;
  try {
    const url = new URL(u);
    return url.toString();
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  // Hard stop in prod
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, error: "Disabled in production" },
      { status: 403 }
    );
  }

  // Require a simple header secret in dev to avoid accidental wipes
  const secret = process.env.DEV_SEED_SECRET || "";
  if (!secret || req.headers.get("x-aikya-dev-secret") !== secret) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  // Ensure envs exist
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !serviceKey) {
    return NextResponse.json(
      { ok: false, error: "Supabase env missing" },
      { status: 500 }
    );
  }

  const svc = createClient(url, serviceKey, { auth: { persistSession: false } });

  // Parse flags
  const wipe = new URL(req.url).searchParams.get("wipe") === "true";

  try {
    if (wipe) {
      // Soft-delete if you keep deleted_at; else hard delete
      const { error: delErr } = await svc.from("sources" as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (delErr) return NextResponse.json({ ok: false, error: delErr.message }, { status: 500 });

      const { error: delStoriesErr } = await svc.from("stories" as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (delStoriesErr) return NextResponse.json({ ok: false, error: delStoriesErr.message }, { status: 500 });
    }

    let created = 0;
    for (const s of mock) {
      // Expecting each mock item roughly like:
      // { title, dek, what, how, why, life_lesson, country, state, city, category, virtues, hero_image, hero_alt, hero_credit, is_published, sources }
      const title = String(s.title || "").trim();
      if (!title) continue;

      const baseSlug = slugify(title);
      const slug = await ensureUniqueSlug(svc, baseSlug);

      const row = {
        slug,
        title,
        dek: s.dek ?? null,
        what: s.what ?? null,
        how: s.how ?? null,
        why: s.why ?? null,
        life_lesson: s.life_lesson ?? null,
        country: s.country ?? "India",
        state: s.state ?? null,
        city: s.city ?? null,
        category: s.category ?? null,
        virtues: Array.isArray(s.virtues) ? s.virtues : null,
        hero_image: sanitizeUrl(s.hero_image),
        hero_alt: s.hero_alt ?? null,
        hero_credit: s.hero_credit ?? null,
        is_published: !!s.is_published,
        published_at: s.is_published ? new Date().toISOString() : null,
        read_minutes:
          typeof s.read_minutes === "number"
            ? s.read_minutes
            : Math.max(2, Math.round(((s.what ?? "") + (s.how ?? "") + (s.why ?? "")).split(/\s+/).length / 200)),
      };

      const { data: createdStory, error: insErr } = await svc
        .from("stories" as any)
        .insert(row)
        .select("id")
        .single();

      if (insErr) {
        return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 });
      }

      const storyId = (createdStory as any).id as string;

      // Upsert simple sources if present
      const srcs =
        Array.isArray(s.sources) && s.sources.length
          ? s.sources
              .map((src: any) => ({
                story_id: storyId,
                name: String(src.name ?? "Source").slice(0, 200),
                url: sanitizeUrl(src.url) as string | null,
              }))
              .filter((x) => x.url)
          : [];

      if (srcs.length) {
        const { error: srcErr } = await svc.from("sources" as any).insert(srcs);
        if (srcErr) {
          return NextResponse.json({ ok: false, error: srcErr.message }, { status: 500 });
        }
      }

      created++;
    }

    return NextResponse.json({ ok: true, created, wiped: wipe });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Seed failed" },
      { status: 500 }
    );
  }
}
