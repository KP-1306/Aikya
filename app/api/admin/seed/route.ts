// app/api/admin/seed/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stories as mock } from "@/lib/mock";

// Only for local/dev
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "Disabled in production" }, { status: 403 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) {
    return NextResponse.json({ ok: false, error: "Supabase env missing" }, { status: 500 });
  }

  const sb = createClient(url, key, { auth: { persistSession: false } });

  // Insert mock stories; NOTE: mock items use camelCase lifeLesson
  const rows = mock.map((s: any) => ({
    slug: s.slug,
    title: s.title,
    dek: s.dek ?? null,
    what: s.what ?? null,
    how: s.how ?? null,
    why: s.why ?? null,
    life_lesson: s.lifeLesson ?? null,   // <-- camel → snake (THIS WAS THE BUILD ERROR)
    country: s.country ?? "India",
    state: s.state ?? null,
    city: s.city ?? null,
    hero_image: s.hero_image ?? null,
    read_minutes: s.read_minutes ?? 3,
    is_published: true,
    published_at: new Date().toISOString(),
    sources: s.sources ?? [],
  }));

  const { error } = await sb.from("stories").insert(rows);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, inserted: rows.length });
}
