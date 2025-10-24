// app/story/[slug]/page.tsx
import { stories } from "@/lib/mock";
import Image from "next/image";
import Link from "next/link";

export default function StoryPage({ params }: { params: { slug: string } }) {
  const s = stories.find((x) => x.slug === params.slug);
  if (!s) return <div className="py-10">Story not found.</div>;

  return (
    <article className="prose max-w-2xl mx-auto prose-headings:scroll-mt-20">
      <nav className="not-prose text-sm text-neutral-500">
        <Link href="/">Home</Link> / {s.country} / {s.state ?? s.city ?? ""}
      </nav>

      <h1>{s.title}</h1>
      <p className="text-lg text-neutral-700">{s.dek}</p>

      <div className="not-prose text-sm text-neutral-500">
        Curated by Aikya • {s.city ?? s.state ?? s.country} •{" "}
        {new Date(s.publishedAt).toDateString()} • {s.readMinutes} min read
      </div>

      {s.heroImage && (
        <figure className="not-prose my-4">
          <div className="relative w-full aspect-[16/9] overflow-hidden rounded-2xl ring-1 ring-black/5">
            <Image src={s.heroImage} alt={s.title} fill className="object-cover" />
          </div>
          <figcaption className="text-xs text-neutral-500 mt-1">
            Image credit: CC0/Stock
          </figcaption>
        </figure>
      )}

      <h3>What happened</h3>
      <p>{s.what}</p>

      <h3>How they acted</h3>
      <p>{s.how}</p>

      <h3>Why it matters</h3>
      <p>{s.why}</p>

      <p>
        <strong>{s.lifeLesson}</strong>
      </p>

      <hr />

      {s.sources?.length ? (
        <div className="not-prose text-sm text-neutral-600 space-y-1">
          <div className="font-medium">Inspired by:</div>
          <ul className="list-disc pl-5">
            {s.sources.map((src) => (
              <li key={src.url}>
                <a
                  className="underline"
                  href={src.url}
                  rel="nofollow noopener"
                  target="_blank"
                >
                  {src.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
