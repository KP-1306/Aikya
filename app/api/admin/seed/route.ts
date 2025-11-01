// app/api/admin/seed/route.ts
import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { stories as mock } from "@/lib/mock";

type StoryIn = {
  title?: string | null;
  dek?: string | null;
  what?: string | null;
  how?: string | null;
  why?: string | null;
  // mock may use either lifeLesson or life_lesson
  lifeLesson?: string | null;
  life_lesson?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  hero_image?: string | null;
  read_minutes?: number | null;
  slug?: string | null;
  is_published?: boolean | null;
  published_at?: string | null;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function svc(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST() {
  // Hard-stop in prod
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, error: "Disabled in production" },
      { status: 403 }
    );
  }

  const sb = svc();

  // Normalize mock → DB shape (handle both lifeLesson & life_lesson)
  const rows = (mock as StoryIn[]).map((s) => ({
    title: s.title ?? null,
    dek: s.dek ?? null,
    what: s.what ?? null,
    how: s.how ?? null,
    why: s.why ?? null,
    life_lesson:
      (s as any).life_lesson ?? (s as any).lifeLesson ?? null, // <-- key fix
    country: s.country ?? "India",
    state: s.state ?? null,
    city: s.city ?? null,
    hero_image: s.hero_image ?? null,
    read_minutes:
      typeof s.read_minutes === "number" && s.read_minutes > 0
        ? Math.round(s.read_minutes)
        : 3,
    slug: s.slug ?? null,
    is_published: s.is_published ?? false,
    published_at: s.published_at ?? null,
  }));

  // Upsert in safe chunks
  const chunk = 100;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += chunk) {
    const slice = rows.slice(i, i + chunk);
    const { error } = await sb.from("stories").upsert(slice, {
      onConflict: "slug",
      ignoreDuplicates: false,
    });
    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, inserted },
        { status: 500 }
      );
    }
    inserted += slice.length;
  }

  return NextResponse.json({ ok: true, inserted });
}
