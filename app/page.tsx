// app/page.tsx
import Link from "next/link";
import { getStories } from "@/lib/data";
import { getCurrentUserState } from "@/lib/user";
import FeedToggle from "@/components/FeedToggle";
import LocalSetupBanner from "@/components/LocalSetupBanner";

export default async function Home({ searchParams }: { searchParams: { [k: string]: string | undefined } }) {
  const profile = await getCurrentUserState();
  const hasLocal = !!profile?.state;

  // decide mode: local (if available) or all
  const mode = searchParams.mode === "all" ? "all" : (hasLocal ? "local" : "all");
  const state = mode === "local" && hasLocal ? profile!.state : undefined;

  const items = await getStories({ state, limit: 24 });

  return (
    <div className="container space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            {mode === "local" && state ? `Good around you in ${state}` : "Latest good around India"}
          </h2>
          <p className="text-sm text-neutral-600">
            {mode === "local" && state
              ? "Stories prioritized from your state. Switch to All for national view."
              : "Uplifting stories from across India. Set your State to personalize."}
          </p>
        </div>

        {/* Toggle: disabled local if no state yet */}
        <FeedToggle hasLocal={hasLocal} />
      </header>

      {!hasLocal && <LocalSetupBanner />}

      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((s: any) => (
          <li key={s.slug} className="card">
            <Link href={`/story/${s.slug}`} className="block p-4">
              <div className="text-xs text-neutral-500">
                {(s.city || s.state || s.country) ?? "—"} • {s.read_minutes ?? s.readMinutes ?? 3} min
              </div>
              <h3 className="mt-1 font-semibold">{s.title}</h3>
              <p className="text-sm text-neutral-600 line-clamp-2 mt-1">
                {s.dek}
              </p>
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
