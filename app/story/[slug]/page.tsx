// app/story/[slug]/page.tsx
import { stories } from "@/lib/mock";
import Image from "next/image";
import Link from "next/link";
import RelatedCarousel from "@/components/RelatedCarousel";
import Comments from "@/components/Comments";
import { getReactions } from "@/lib/reactions";
import LikeButton from "@/components/LikeButton";
import SaveButton from "@/components/SaveButton";

export default async function StoryPage({ params }: { params: { slug: string } }) {
  const s = stories.find((x) => x.slug === params.slug);
  if (!s) return <div className="py-10 container">Story not found.</div>;

  // Reactions: only fetch from DB when the story has a real DB id
  const reactions = (s as any).id
    ? await getReactions((s as any).id as string)
    : { likeCount: 0, liked: false, saved: false };

  // helpers to handle mock vs DB field names
  const published = new Date((s as any).publishedAt ?? (s as any).published_at);
  const minutes = (s as any).readMinutes ?? (s as any).read_minutes ?? 3;

  // slug helpers for city/state links (inline, no import needed)
  const citySlug = s.city
    ? encodeURIComponent(s.city.toLowerCase().replace(/\s+/g, "-"))
    : null;
  const stateSlug = s.state
    ? encodeURIComponent(s.state.toLowerCase().replace(/\s+/g, "-"))
    : null;

  return (
    <>
      <article className="prose max-w-2xl mx-auto prose-headings:scroll-mt-24">
        {/* Breadcrumbs */}
        <nav className="not-prose text-sm text-neutral-500 mb-2">
          <Link href="/" className="underline-offset-4 hover:underline">Home</Link>
          {" / "}
          {s.country}
          {s.state ? ` / ${s.state}` : s.city ? ` / ${s.city}` : ""}
        </nav>

        {/* Title & dek */}
        <h1>{s.title}</h1>
        <p className="text-lg text-neutral-700">{s.dek}</p>

        {/* Meta (linked city/state) */}
        <div className="not-prose text-sm text-neutral-500">
          Curated by Aikya •{" "}
          {s.city ? (
            <Link className="underline" href={`/city/${citySlug}`}>
              {s.city}
            </Link>
          ) : s.state ? (
            <Link className="underline" href={`/state/${stateSlug}`}>
              {s.state}
            </Link>
          ) : (
            s.country
          )}{" "}
          • {published.toDateString()} • {minutes} min read
        </div>

        {/* Reactions (Like / Save) */}
        <div className="not-prose mt-4 flex items-center gap-3">
          {(s as any).id ? (
            <>
              <LikeButton
                storyId={(s as any).id as string}
                initialCount={reactions.likeCount}
                initialLiked={reactions.liked}
              />
              <SaveButton
                storyId={(s as any).id as string}
                initialSaved={reactions.saved}
              />
            </>
          ) : (
            <div className="text-xs text-neutral-500">
              Reactions appear for published stories.
            </div>
          )}
        </div>

        {/* Hero image */}
        {s.heroImage && (
          <figure className="not-prose my-4">
            <div className="relative w-full aspect-[16/9] overflow-hidden rounded-2xl ring-1 ring-black/5">
              <Image src={s.heroImage} alt={s.title} fill className="object-cover" />
            </div>
            <figcaption className="mt-1">Image credit: CC0/Stock</figcaption>
          </figure>
        )}

        {/* Sections */}
        <h3>What happened</h3>
        <p>{s.what}</p>

        <h3>How they acted</h3>
        <p>{s.how}</p>

        <h3>Why it matters</h3>
        <p>{s.why}</p>

        <p><strong>{s.lifeLesson}</strong></p>

        <hr />

        {/* Sources */}
        {s.sources?.length ? (
          <div className="not-prose text-sm text-neutral-600 space-y-1">
            <div className="font-medium">Inspired by:</div>
            <ul className="sources-list">
              {s.sources.map((src: { url: string; name: string }) => (
                <li key={src.url}>
                  <a className="underline" href={src.url} rel="nofollow noopener" target="_blank">
                    {src.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </article>

      {/* Comments (renders only when story has a real DB id) */}
      <div className="container max-w-2xl">
        {(s as any).id ? (
          <Comments storyId={(s as any).id as string} />
        ) : (
          <div className="mt-8 text-sm text-neutral-500">
            Comments will appear here once this story is published from the database.
          </div>
        )}
      </div>

      {/* Related slider */}
      <div className="container">
        <RelatedCarousel current={s} all={stories} />
      </div>
    </>
  );
}
