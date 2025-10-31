// components/FeaturedHero.tsx
import Image from "next/image";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

/** Keep types minimal + optional to avoid hard crashes if fields are missing */
type Story = {
  id?: string;
  slug?: string;
  title?: string | null;
  dek?: string | null;
  hero_image?: string | null;
  city?: string | null;
  state?: string | null;
  like_count?: number | null;
  published_at?: string | null;
  created_at?: string | null;
};

function fmtDate(d?: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
}

export default async function FeaturedHero() {
  const sb = supabaseServer();

  // -------- 1) Fetch a recent batch (fail-soft) --------
  let items: Story[] = [];
  try {
    // Try “week’s best” first
    const weekIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: best, error: bestErr } = await sb
      .from("stories")
      .select(
        "id,slug,title,dek,hero_image,city,state,like_count,published_at,created_at"
      )
      .eq("is_published", true)
      .is("deleted_at", null)
      .gte("published_at", weekIso)
      .order("like_count", { ascending: false, nullsFirst: false })
      .order("published_at", { ascending: false })
      .limit(8);

    if (!bestErr && best && best.length > 0) {
      items = best as Story[];
    } else {
      // Fallback: recent stories
      const { data: recent } = await sb
        .from("stories")
        .select(
          "id,slug,title,dek,hero_image,city,state,like_count,published_at,created_at"
        )
        .eq("is_published", true)
        .is("deleted_at", null)
        .order("published_at", { ascending: false })
        .limit(8);
      items = (recent as Story[]) ?? [];
    }
  } catch {
    items = []; // never crash the page
  }

  const primary = items[0];
  const others = items.slice(1, 7);

  // -------- 2) Lightweight weekly stats (fail-soft) --------
  let weeklyNew = 0;
  let statesCovered = 0;
  let totalLikes = 0;
  let topCity: string | null = null;

  try {
    const weekIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: statRows } = await sb
      .from("stories")
      .select("city,state,like_count,published_at")
      .eq("is_published", true)
      .is("deleted_at", null)
      .gte("published_at", weekIso)
      .limit(500); // keep it light

    const rows = statRows ?? [];
    weeklyNew = rows.length;
    statesCovered = new Set(rows.map((r: any) => r.state).filter(Boolean)).size;
    totalLikes = rows.reduce((s: number, r: any) => s + (r?.like_count ?? 0), 0);
    const cityCounts: Record<string, number> = {};
    for (const r of rows) {
      const c = (r?.city ?? "").trim();
      if (!c) continue;
      cityCounts[c] = (cityCounts[c] ?? 0) + 1;
    }
    topCity =
      Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  } catch {
    // keep defaults
  }

  return (
    <section className="relative isolate overflow-hidden">
      {/* subtle gradient banner */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(16,185,129,.18),transparent_60%),radial-gradient(900px_500px_at_90%_-20%,rgba(59,130,246,.12),transparent_60%)]" />

      <div className="container max-w-6xl px-4 md:px-6 pt-8 md:pt-12">
        {/* Header + chips */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="prose prose-emerald max-w-none">
            <h1 className="mb-2 leading-tight">This Week’s Best</h1>
            <p className="text-neutral-600">
              Uplifting stories curated across India. Set your region or search
              to personalize.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="rounded-full bg-white/80 ring-1 ring-black/10 px-3 py-1.5 text-sm">
              <span className="font-semibold">{weeklyNew}</span> new this week
            </div>
            <div className="rounded-full bg-white/80 ring-1 ring-black/10 px-3 py-1.5 text-sm">
              States: <span className="font-semibold">{statesCovered}</span>
            </div>
            <div className="rounded-full bg-white/80 ring-1 ring-black/10 px-3 py-1.5 text-sm">
              Top city: <span className="font-semibold">{topCity ?? "—"}</span>
            </div>
            <div className="rounded-full bg-white/80 ring-1 ring-black/10 px-3 py-1.5 text-sm">
              Likes: <span className="font-semibold">{totalLikes}</span>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Primary highlight */}
          {primary?.slug ? (
            <Link
              href={`/story/${primary.slug}`}
              className="group relative overflow-hidden rounded-2xl ring-1 ring-black/10 bg-white md:col-span-2"
            >
              <div className="relative h-[260px] md:h-[360px]">
                <Image
                  src={primary.hero_image || "/og.jpg"}
                  alt={primary.title || "Story"}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4 md:p-5 text-white">
                <div className="text-xs opacity-90">
                  {(primary.city || primary.state || "India") +
                    (primary.published_at ? ` · ${fmtDate(primary.published_at)}` : "")}
                </div>
                <h2 className="mt-1 text-xl md:text-2xl font-semibold leading-snug">
                  {primary.title ?? "Untitled"}
                </h2>
                {primary.dek && (
                  <p className="mt-1 hidden md:block max-w-2xl text-white/90">
                    {primary.dek}
                  </p>
                )}
              </div>
            </Link>
          ) : (
            <div className="md:col-span-2 rounded-2xl ring-1 ring-black/10 bg-white p-10 text-neutral-500">
              No featured stories yet.
            </div>
          )}

          {/* Side column list */}
          <div className="grid grid-cols-1 gap-4">
            {others.map((s, i) =>
              s?.slug ? (
                <Link
                  key={s.slug + i}
                  href={`/story/${s.slug}`}
                  className="group relative overflow-hidden rounded-2xl ring-1 ring-black/10 bg-white"
                >
                  <div className="relative h-[120px]">
                    <Image
                      src={s.hero_image || "/og.jpg"}
                      alt={s.title || "Story"}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                    <div className="text-[11px] opacity-90">
                      {(s.city || s.state || "India") +
                        (s.published_at ? ` · ${fmtDate(s.published_at)}` : "")}
                    </div>
                    <div className="mt-0.5 font-medium leading-snug line-clamp-2">
                      {s.title ?? "Untitled"}
                    </div>
                  </div>
                </Link>
              ) : null
            )}

            {/* If fewer than 5 side items, pad with CTA */}
            {others.length < 5 && (
              <Link
                href="/submit"
                className="grid aspect-[16/9] place-items-center rounded-2xl ring-1 ring-dashed ring-emerald-300/70 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
              >
                Share a positive story →
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
