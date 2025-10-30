// app/page.tsx
import Link from "next/link";
import Image from "next/image";

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

// Simple card (shared by feed + search results)
function StoryCard({ s }: { s: any }) {
  return (
    <li key={s.slug ?? s.id} className="card overflow-hidden">
      <Link href={`/story/${s.slug}`} className="block">
        <div className="relative w-full aspect-[16/9] bg-neutral-100">
          {s.hero_image && (
            <Image
              src={s.hero_image}
              alt={s.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          )}
        </div>
        <div className="p-4">
          <div className="text-xs text-neutral-500">
            {(s.city || s.state || s.country) ?? "—"} • {s.read_minutes ?? 3} min
          </div>
          <h3 className="mt-1 font-semibold line-clamp-2">{s.title}</h3>
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

  // 1) Region info (from your helper)
  const profile = await getCurrentUserRegion();
  const hasCity = !!profile?.city;
  const hasState = !!profile?.state;

  // 2) Mode: default City → State → All
  const modeParam = searchParams.mode as "city" | "state" | "all" | undefined;
  const mode: "city" | "state" | "all" =
    modeParam || (hasCity ? "city" : hasState ? "state" : "all");

  // 3) Filters for main feed
  const city = mode === "city" && hasCity ? profile!.city : undefined;
  const state = mode === "state" && hasState ? profile!.state : undefined;

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
    mode === "city" && city
      ? `Good around you in ${city}`
      : mode === "state" && state
      ? `Good around you in ${state}`
      : "Latest good around India";

  const sub =
    mode === "city" && city
      ? "Stories prioritized from your city. Switch to State or All anytime."
      : mode === "state" && state
      ? "Stories prioritized from your state. Switch to City or All anytime."
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
      } else {
        searchResults = [];
        searchMode = undefined;
      }
    } catch {
      searchResults = [];
      searchMode = undefined;
    }
  }

  // 8) Prefetch URLs for story pages (main grid + recs)
  const prefetchHrefs = [
    ...items.map((s: any) => `/story/${s.slug}`),
    ...(uniqueRecs ?? []).map((r: any) => `/story/${r.slug}`),
  ];
  const prefetchList = Array.from(new Set(prefetchHrefs));

  return (
    <div className="container space-y-8">
      {/* Top header with mode toggle + Search */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{heading}</h2>
          <p className="text-sm text-neutral-600">{sub}</p>
        </div>

        {/* Simple GET search (keeps URL shareable). Preserves current mode via hidden input. */}
        <form method="GET" className="flex items-center gap-2 w-full sm:w-auto">
          <input type="hidden" name="mode" value={mode} aria-hidden="true" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search uplifting stories…"
            className="input w-full sm:w-80"
            aria-label="Search stories"
          />
          <button className="btn" type="submit">
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
        </form>

        {/* Region toggle on the far right (on larger screens) */}
        <div className="sm:ml-6">
          <FeedToggle hasCity={hasCity} hasState={hasState} />
        </div>
      </header>

      {/* Hint to encourage setting location */}
      {!(hasCity || hasState) && <LocalSetupBanner />}

      {/* Search results (if any) */}
      {hasQuery && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg font-semibold">Search results for “{q}”</h3>
            {/* Badge shows whether results came from vector or keyword path */}
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
          <h3 className="text-lg font-semibold">Featured in this view</h3>
          <p className="text-xs text-neutral-500">Region: {mode.toUpperCase()}</p>
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
              <Link key={r.id} href={`/story/${r.slug}`} className="card overflow-hidden">
                {r.hero_image && (
                  <div className="relative aspect-[16/9] bg-neutral-100">
                    <Image
                      src={r.hero_image}
                      alt={r.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="text-xs text-neutral-500">{r.city ?? r.state ?? "—"}</div>
                  <h4 className="font-medium line-clamp-2">{r.title}</h4>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trigger Next.js prefetch for visible stories once grid enters viewport */}
      <PrefetchStories hrefs={prefetchList} max={24} />
    </div>
  );
}
