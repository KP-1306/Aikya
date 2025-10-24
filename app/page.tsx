// app/page.tsx
import Link from "next/link";
import Image from "next/image";
import { getStories } from "@/lib/data";
import { getCurrentUserRegion } from "@/lib/user";
import FeedToggle from "@/components/FeedToggle";
import LocalSetupBanner from "@/components/LocalSetupBanner";

export default async function Home({
  searchParams,
}: {
  searchParams: { [k: string]: string | undefined };
}) {
  const profile = await getCurrentUserRegion();
  const hasCity = !!profile?.city;
  const hasState = !!profile?.state;

  // Mode selection: default City → State → All
  const modeParam = searchParams.mode as "city" | "state" | "all" | undefined;
  const mode: "city" | "state" | "all" =
    modeParam || (hasCity ? "city" : hasState ? "state" : "all");

  // Decide filters based on mode
  const city = mode === "city" && hasCity ? profile!.city : undefined;
  const state = mode === "state" && hasState ? profile!.state : undefined;

  const items = await getStories({ city, state, limit: 24 });

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
    <div className="container space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{heading}</h2>
          <p className="text-sm text-neutral-600">{sub}</p>
        </div>

        <FeedToggle hasCity={hasCity} hasState={hasState} />
      </header>

      {!(hasCity || hasState) && <LocalSetupBanner />}

      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((s: any) => (
          <li key={s.slug} className="card overflow-hidden">
            <Link href={`/story/${s.slug}`} className="block">
              <div className="relative w-full aspect-[16/9] bg-neutral-100">
                {s.hero_image && (
                  <Image src={s.hero_image} alt={s.title} fill className="object-cover" />
                )}
              </div>
              <div className="p-4">
                <div className="text-xs text-neutral-500">
                  {(s.city || s.state || s.country) ?? "—"} • {s.read_minutes ?? 3} min
                </div>
                <h3 className="mt-1 font-semibold line-clamp-2">{s.title}</h3>
                <p className="text-sm text-neutral-600 line-clamp-2 mt-1">{s.dek}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {items.length === 0 && (
        <div className="text-sm text-neutral-500">
          No stories yet for this view. Try switching to{" "}
          <a className="underline" href="/?mode=all">All</a>.
        </div>
      )}
    </div>
  );
}
