// app/page.tsx
import Link from "next/link";
import Image from "next/image";

import { getStories } from "@/lib/data";
import { getCurrentUserRegion } from "@/lib/user";

import FeedToggle from "@/components/FeedToggle";
import LocalSetupBanner from "@/components/LocalSetupBanner";

// Personalized recs (state + popularity); add lib/recs.ts from earlier step.
import { getRecommendations } from "@/lib/recs";
import { supabaseServer } from "@/lib/supabase/server";

type SearchParams = { [k: string]: string | undefined };

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
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
  const items = await getStories({ city, state, limit: 24 });

  // 5) Personalized rail — uses user + (fallback) state
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  const recs = await getRecommendations({
    userId: user?.id,
    state: profile?.state,
    limit: 6,
  });

  // avoid showing duplicates between main grid and recs
  const seen = new Set((items ?? []).map((s: any) => s.slug));
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

  return (
    <div className="container space-y-8">
      {/* Top header with mode toggle */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{heading}</h2>
          <p className="text-sm text-neutral-600">{sub}</p>
        </div>
        <FeedToggle hasCity={hasCity} hasState={hasState} />
      </header>

      {/* Hint to encourage setting location */}
      {!(hasCity || hasState) && <LocalSetupBanner />}

      {/* Main feed grid */}
      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((s: any) => (
          <li key={s.slug} className="card overflow-hidden">
            <Link href={`/story/${s.slug}`} className="block">
              <div className="relative w-full aspect-[16/9] bg-neutral-100">
                {s.hero_image && (
                  <Image
                    src={s.hero_image}
                    alt={s.title}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="p-4">
                <div className="text-xs text-neutral-500">
                  {(s.city || s.state || s.country) ?? "—"} •{" "}
                  {s.read_minutes ?? 3} min
                </div>
                <h3 className="mt-1 font-semibold line-clamp-2">{s.title}</h3>
                <p className="text-sm text-neutral-600 line-clamp-2 mt-1">
                  {s.dek}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {items.length === 0 && (
        <div className="text-sm text-neutral-500">
          No stories yet for this view. Try switching to{" "}
          <a className="underline" href="/?mode=all">
            All
          </a>
          .
        </div>
      )}

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
                  <div className="relative aspect-[16/9]">
                    <Image
                      src={r.hero_image}
                      alt={r.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="text-xs text-neutral-500">
                    {r.city ?? r.state ?? "—"}
                  </div>
                  <h4 className="font-medium line-clamp-2">{r.title}</h4>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
