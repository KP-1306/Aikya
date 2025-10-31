// app/page.tsx
import Link from "next/link";
import Image from "next/image";

import FeaturedHero from "@/components/FeaturedHero";
import { getStories } from "@/lib/data";
import { getCurrentUserRegion } from "@/lib/user";
import FeedToggle from "@/components/FeedToggle";
import LocalSetupBanner from "@/components/LocalSetupBanner";
import { getRecommendations } from "@/lib/recs";
import { supabaseServer } from "@/lib/supabase/server";
import PrefetchStories from "@/components/PrefetchStories";

type SearchParams = { [k: string]: string | undefined };

type SearchResponse = {
  data: any[];
  mode?: "vector" | "text";
  error?: string | null;
};

// Small, reusable card
function StoryCard({ s }: { s: any }) {
  return (
    <li
      key={s.slug ?? s.id}
      className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <Link href={`/story/${s.slug}`} className="block">
        <div className="relative w-full aspect-[16/9] bg-neutral-100 overflow-hidden">
          {s.hero_image ? (
            <Image
              src={s.hero_image}
              alt={s.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-neutral-400 text-sm">
              Aikya
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="text-xs text-neutral-500">
            {(s.city || s.state || s.country) ?? "—"} · {s.read_minutes ?? 3} min
          </div>
          <h3 className="mt-1 font-semibold leading-snug line-clamp-2">
            {s.title}
          </h3>
          {s.dek && (
            <p className="text-sm text-neutral-600 line-clamp-2 mt-1">{s.dek}</p>
          )}
        </div>
      </Link>
    </li>
  );
}

// Build an origin for server-side fetch to /api/search
function getOrigin() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  // 0) Optional search query (from GET ?q=)
  const q = (searchParams.q ?? "").trim();
  const hasQuery = q.length > 0;

  // 1) Region info from profile
  const profile = await getCurrentUserRegion();
  const hasCity = !!profile?.city;
  const hasState = !!profile?.state;

  // Optional URL overrides (browse without saving to profile)
  const cityOverride = (searchParams.city ?? "").trim() || undefined;
  const stateOverride = (searchParams.state ?? "").trim() || undefined;

  // 2) Requested mode vs effective mode (auto-fallback when profile missing)
  const requested =
    (searchParams.mode as "city" | "state" | "all" | undefined) ??
    (hasCity ? "city" : hasState ? "state" : "all");

  const mode: "city" | "state" | "all" =
    requested === "city" && !hasCity
      ? hasState
        ? "state"
        : "all"
      : requested === "state" && !hasState
      ? hasCity
        ? "city"
        : "all"
      : requested;

  // 3) Filters for main feed (use URL override if present)
  const city =
    mode === "city"
      ? cityOverride ?? (hasCity ? profile!.city : undefined)
      : undefined;

  const state =
    mode === "state"
      ? stateOverride ?? (hasState ? profile!.state : undefined)
      : undefined;

  // 4) Main feed stories
  const items = (await getStories({ city, state, limit: 24 })) ?? [];

  // 5) Personalized rail — uses user + (fallback) state
  const sb = supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();

  const recs = (await getRecommendations({
    userId: user?.id,
    state: profile?.state,
    limit: 6,
  })) as any[];

  // avoid showing duplicates between main grid and recs
  const seen = new Set(items.map((s: any) => s.slug));
  const uniqueRecs = (recs ?? []).filter((r: any) => !seen.has(r.slug));

  // 6) Headings
  const heading =
    mode === "city" && (city ?? profile?.city)
      ? `Good around you in ${city ?? profile?.city}`
      : mode === "state" && (state ?? profile?.state)
      ? `Good around you in ${state ?? profile?.state}`
      : "Latest good around India";

  const sub =
    mode === "city"
      ? "Stories prioritized from your chosen city. Switch mode or browse another city."
      : mode === "state"
      ? "Stories prioritized from your chosen state. Switch mode or browse another state."
      : "Uplifting stories from across India. Set your City/State to personalize.";

  // 7) Server-side call to /api/search (POST) if q is present
  let searchResults: any[] = [];
  let searchMode: "vector" | "text" | undefined;
  if (hasQuery) {
    try {
      const res = await fetch(`${getOrigin()}/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ q, k: 12 }),
      });
      const j = (await res.json()) as SearchResponse;
      if (res.ok && Array.isArray(j.data)) {
        searchResults = j.data;
        searchMode = j.mode;
      }
    } catch {
      // swallow – empty state below
    }
  }

  // 8) Prefetch URLs for story pages (main grid + recs)
  const prefetchHrefs = [
    ...items.map((s: any) => `/story/${s.slug}`),
    ...(uniqueRecs ?? []).map((r: any) => `/story/${r.slug}`),
  ];
  const prefetchList = Array.from(new Set(prefetchHrefs));

  // Derived labels
  const regionLabel =
    mode === "city" ? "CITY" : mode === "state" ? "STATE" : "ALL";

  const mainTitle =
    mode === "city" && (city ?? profile?.city)
      ? `Stories in ${city ?? profile?.city}`
      : mode === "state" && (state ?? profile?.state)
      ? `Stories in ${state ?? profile?.state}`
      : "Latest from across India";

  return (
    <>
      {/* Weekly-best hero with live stats */}
      <FeaturedHero />

      <div className="container space-y-8">
        {/* Top header with mode toggle + Search */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">{heading}</h2>
            <p className="text-sm text-neutral-600">{sub}</p>
          </div>

          {/* Search (GET) – preserves mode via hidden input */}
          <form method="GET" className="w-full sm:w-auto">
            <input type="hidden" name="mode" value={mode} aria-hidden="true" />
            {/* Keep any browsing override in the URL when searching */}
            {mode === "city" && city && (
              <input type="hidden" name="city" value={city} />
            )}
            {mode === "state" && state && (
              <input type="hidden" name="state" value={state} />
            )}

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-80">
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Search uplifting stories…"
                  className="w-full rounded-full border border-neutral-300 bg-white px-4 py-2 pl-10 text-sm outline-none focus:border-neutral-400"
                  aria-label="Search stories"
                />
                <svg
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <button className="rounded-full border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50">
                Search
              </button>
              {hasQuery && (
                <Link
                  href={mode ? `/?mode=${mode}` : "/"}
                  className="text-sm text-neutral-500 underline whitespace-nowrap"
                  aria-label="Clear search"
                >
                  Clear
                </Link>
              )}
            </div>
          </form>

          {/* Region toggle + quick browse (doesn't change profile) */}
          <div className="sm:ml-6 flex flex-col gap-2">
            <FeedToggle hasCity={hasCity} hasState={hasState} />
            {mode !== "all" && (
              <form method="GET" className="flex items-center gap-2">
                <input type="hidden" name="mode" value={mode} />
                {mode === "city" && (
                  <input
                    name="city"
                    className="input w-40"
                    placeholder="Browse city…"
                    defaultValue={cityOverride ?? ""}
                    aria-label="Browse by city"
                  />
                )}
                {mode === "state" && (
                  <input
                    name="state"
                    className="input w-40"
                    placeholder="Browse state…"
                    defaultValue={stateOverride ?? ""}
                    aria-label="Browse by state"
                  />
                )}
                <button className="btn" type="submit">
                  Apply
                </button>
              </form>
            )}
          </div>
        </header>

        {/* Hint to encourage setting location */}
        {!(hasCity || hasState) && <LocalSetupBanner />}

        {/* Search results (if any) */}
        {hasQuery && (
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-semibold">Search results for “{q}”</h3>
              <p className="text-xs text-neutral-500">
                {searchMode === "vector" ? "AI semantic search" : "Keyword search"}
              </p>
            </div>

            {searchResults.length > 0 ? (
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((s: any) => (
                  <StoryCard key={s.slug ?? s.id} s={s} />
                ))}
              </ul>
            ) : (
              <div className="text-sm text-neutral-500">
                No matches found. Try different keywords or{" "}
                <Link href={mode ? `/?mode=${mode}` : "/"} className="underline">
                  browse recent stories
                </Link>
                .
              </div>
            )}
          </section>
        )}

        {/* Main feed grid */}
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg font-semibold">
              {mainTitle}{" "}
              <span className="text-xs text-neutral-500 font-normal">
                ({items.length})
              </span>
            </h3>
            <p className="text-xs text-neutral-500">Region: {regionLabel}</p>
          </div>

          {items.length > 0 ? (
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((s: any) => (
                <StoryCard key={s.slug} s={s} />
              ))}
            </ul>
          ) : (
            <div className="text-sm text-neutral-500">
              No stories yet for this view. Try switching to{" "}
              <a className="underline" href="/?mode=all">
                All
              </a>
              .
            </div>
          )}
        </section>

        {/* Personalized rail (optional, only when we have recs) */}
        {uniqueRecs.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-semibold">
                Recommended for {profile?.state ? `you in ${profile.state}` : "you"}
              </h3>
              <p className="text-xs text-neutral-500">
                Based on what’s popular and your region
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {uniqueRecs.map((r: any) => (
                <Link
                  key={r.id}
                  href={`/story/${r.slug}`}
                  className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  {r.hero_image && (
                    <div className="relative aspect-[16/9] bg-neutral-100 overflow-hidden">
                      <Image
                        src={r.hero_image}
                        alt={r.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="text-xs text-neutral-500">
                      {r.city ?? r.state ?? "—"}
                    </div>
                    <h4 className="font-medium leading-snug line-clamp-2">
                      {r.title}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Trigger Next.js prefetch for visible stories once grid enters viewport */}
        <PrefetchStories hrefs={prefetchList} max={24} />
      </div>
    </>
  );
}
