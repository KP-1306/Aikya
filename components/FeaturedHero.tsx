// components/FeaturedHero.tsx
import Image from "next/image";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

type Story = {
  id: string;
  slug: string;
  title: string;
  dek: string | null;
  hero_image: string | null;
  city: string | null;
  state: string | null;
  like_count: number | null;
  published_at: string | null;
};

function fmtDate(d?: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export const dynamic = "force-dynamic"; // ensure fresh render

export default async function FeaturedHero() {
  // Use anon server client (no service-role key required)
  const sb = supabaseServer();

  // Defaults so we can render even if queries fail
  let items: Story[] = [];
  let totalThisWeek = 0;
  let statesCovered = 0;
  let totalLikes = 0;
  let topCity = "—";

  try {
    // Try to get “week’s best” (likes + recency)
    const { data: best, error: bestErr } = await sb
      .from("stories")
      .select("id,slug,title,dek,hero_image,city,state,like_count,published_at")
      .eq("is_published", true)
      .is("deleted_at", null)
      .gte("published_at", new Date(Date.now() - 7 * 864e5).toISOString())
      .order("like_count", { ascending: false, nullsFirst: false })
      .order("published_at", { ascending: false })
      .limit(8);

    if (bestErr) throw bestErr;

    if (best && best.length > 0) {
      items = best as Story[];
    } else {
      const { data: recent, error: recErr } = await sb
        .from("stories")
        .select("id,slug,title,dek,hero_image,city,state,like_count,published_at")
        .eq("is_published", true)
        .is("deleted_at", null)
        .order("published_at", { ascending: false })
        .limit(8);
      if (recErr) throw recErr;
      items = (recent as Story[]) ?? [];
    }

    // Lightweight “stats” for the week (all optional)
    const { data: statRows } = await sb
      .from("stories")
      .select("id, state, city, like_count, published_at")
      .eq("is_published", true)
      .is("deleted_at", null)
      .gte("published_at", new Date(Date.now() - 7 * 864e5).toISOString());

    totalThisWeek = statRows?.length ?? 0;
    statesCovered = new Set((statRows ?? []).map(r => r.state).filter(Boolean)).size;
    totalLikes = (statRows ?? []).reduce((s, r) => s + (r.like_count ?? 0), 0);

    const cityFreq = new Map<string, number>();
    (statRows ?? []).forEach(r => {
      const key = (r.city || "").trim();
      if (!key) return;
      cityFreq.set(key, (cityFreq.get(key) ?? 0) + 1);
    });
    topCity = [...cityFreq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  } catch {
    // Swallow errors — render skeleton/empty hero below
    items = items ?? [];
  }

  const primary = items[0];
  const others = items.slice(1, 7);

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
              Uplifting stories curated across India. Set your region or search to personalize.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="rounded-full bg-white/80 ring-1 ring-black/10 px-3 py-1.5 text-sm">
              <span className="font-semibold">{totalThisWeek}</span> new this week
            </div>
            <div className="rounded-full bg-white/80 ring-1 ring-black/10 px-3 py-1.5 text-sm">
              States: <span className="font-semibold">{statesCovered}</span>
            </div>
            <div className="rounded-full bg-white/80 ring-1 ring-black/10 px-3 py-1.5 text-sm">
              Top city: <span className="font-semibold">{topCity}</span>
            </div>
            <div className="rounded-full bg-white/80 ring-1 ring-black/10 px-3 py-1.5 text-sm">
              Likes: <span className="font-semibold">{totalLikes}</span>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Primary highlight */}
          {primary ? (
            <Link
              href={`/story/${primary.slug}`}
              className="group relative overflow-hidden rounded-2xl ring-1 ring-black/10 bg-white md:col-span-2"
            >
              <div className="relative h-[260px] md:h-[360px]">
                <Image
                  src={primary.hero_image || "/og.jpg"}
                  alt={primary.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4 md:p-5 text-white">
                <div className="text-xs opacity-90">
                  {primary.city || primary.state || "India"} · {fmtDate(primary.published_at)}
                </div>
                <h2 className="mt-1 text-xl md:text-2xl font-semibold leading-snug">
                  {primary.title}
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
            {others.map((s) => (
              <Link
                key={s.id}
                href={`/story/${s.slug}`}
                className="group relative overflow-hidden rounded-2xl ring-1 ring-black/10 bg-white"
              >
                <div className="relative h-[120px]">
                  <Image
                    src={s.hero_image || "/og.jpg"}
                    alt={s.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                  <div className="text-[11px] opacity-90">
                    {s.city || s.state || "India"} · {fmtDate(s.published_at)}
                  </div>
                  <div className="mt-0.5 font-medium leading-snug line-clamp-2">
                    {s.title}
                  </div>
                </div>
              </Link>
            ))}

            {/* If fewer than 5 items, pad with CTA */}
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
