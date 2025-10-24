// app/city/[city]/page.tsx
import Link from "next/link";
import Image from "next/image";
import { getStories } from "@/lib/data";
import { fromSlug } from "@/lib/slug";

type Params = { city: string };

export async function generateMetadata({ params }: { params: Params }) {
  const name = fromSlug(params.city);
  const title = `Good news from ${name} — Aikya`;
  const description = `Latest uplifting stories around ${name}. Local-first, positive news with life lessons.`;
  const url = `https://aikyanow.netlify.app/city/${params.city}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

// If you want static params later, you can prebuild top cities.
// For now we keep it dynamic and cache per-request (CDN handles it).
export const revalidate = 60; // revalidate every 60s

export default async function CityPage({ params }: { params: Params }) {
  const cityName = fromSlug(params.city);
  const items = await getStories({ city: cityName, limit: 36 });

  return (
    <div className="container space-y-6 py-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Good around you in {cityName}</h1>
          <p className="text-sm text-neutral-600">
            Uplifting, local-first stories. Switch to state or national view from the home page.
          </p>
        </div>
        <nav className="text-sm">
          <Link href="/" className="underline hover:no-underline">← Home</Link>
        </nav>
      </header>

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
          No stories yet for {cityName}. See{" "}
          <Link href="/" className="underline">All stories</Link>.
        </div>
      )}
    </div>
  );
}
