// app/story/[slug]/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import NextDynamic from "next/dynamic";
import { notFound } from "next/navigation";

import { requireSupabaseService } from "@/lib/supabase/service";
import { getReactions } from "@/lib/reactions";

// Client-only Proof-of-Good panel
const ProofPanel = NextDynamic(() => import("@/components/ProofPanel"), { ssr: false });

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---- Helpers ----
async function fetchStory(slug: string) {
  const svc = requireSupabaseService();
  const { data, error } = await svc
    .from("stories")
    .select(
      `
      id, slug, title, dek, hero_image,
      what, how, why, life_lesson,
      city, state, country,
      read_minutes, published_at, updated_at, is_published
    `
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
}

async function fetchRelated(story: any) {
  const svc = requireSupabaseService();

  const base = svc
    .from("stories")
    .select("id, slug, title, hero_image, city, state, country, read_minutes")
    .eq("is_published", true)
    .neq("id", story.id)
    .order("published_at", { ascending: false });

  let qry = base.limit(12);
  if (story.city) qry = qry.eq("city", story.city);
  else if (story.state) qry = qry.eq("state", story.state);

  const { data } = await qry;
  return data ?? [];
}

function canonicalBase() {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "https://aikyanow.netlify.app";
}

// ---- Metadata (uses DB) ----
export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  try {
    const s = await fetchStory(params.slug);
    if (!s) {
      return {
        title: "Aikya — Good Around You",
        description: "Local-first, uplifting stories with life lessons.",
      };
    }

    const base = canonicalBase();
    const url = `${base}/story/${params.slug}`;
    const title = `${s.title} — Aikya`;
    const description = s.dek || "Local-first, uplifting stories with life lessons.";
    const image = s.hero_image || "/og.jpg";

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: { title, description, url, type: "article", images: [{ url: image }] },
      twitter: { card: "summary_large_image", title, description, images: [image] },
    };
  } catch {
    return {
      title: "Aikya — Good Around You",
      description: "Local-first, uplifting stories with life lessons.",
    };
  }
}

// ---- Page ----
export default async function StoryPage({ params }: { params: { slug: string } }) {
  const s = await fetchStory(params.slug);
  if (!s) notFound();

  const reactions = await getReactions(s.id as string).catch(() => ({
    likeCount: 0,
    liked: false,
    saved: false,
  }));

  const publishedDate = s.published_at ? new Date(s.published_at) : new Date();
  const minutes = s.read_minutes ?? 3;
  const hero = s.hero_image ?? null;

  const related = await fetchRelated(s);

  const citySlug = s.city ? encodeURIComponent(s.city.toLowerCase().replace(/\s+/g, "-")) : null;
  const stateSlug = s.state ? encodeURIComponent(s.state.toLowerCase().replace(/\s+/g, "-")) : null;

  return (
    <>
      <article className="prose max-w-2xl mx-auto prose-headings:scroll-mt-24">
        {/* Breadcrumbs */}
        <nav className="not-prose text-sm text-neutral-500 mb-2">
          <Link href="/" className="underline-offset-4 hover:underline">Home</Link>{" / "}
          {s.country}
          {s.state ? ` / ${s.state}` : s.city ? ` / ${s.city}` : ""}
        </nav>

        {/* Title & dek */}
        <h1>{s.title}</h1>
        {s.dek && <p className="text-lg text-neutral-700">{s.dek}</p>}

        {/* Meta (linked city/state) */}
        <div className="not-prose text-sm text-neutral-500">
          Curated by Aikya •{" "}
          {s.city ? (
            <Link className="underline" href={`/city/${citySlug}`}>{s.city}</Link>
          ) : s.state ? (
            <Link className="underline" href={`/state/${stateSlug}`}>{s.state}</Link>
          ) : (
            s.country
          )}{" "}
          • {publishedDate.toDateString()} • {minutes} min read
        </div>

        {/* Reactions (Like / Save) */}
        <div className="not-prose mt-4 flex items-center gap-3">
          {/* @ts-expect-error Server/Client boundary handled in components */}
          <LikeButton
            storyId={s.id as string}
            initialCount={reactions.likeCount}
            initialLiked={reactions.liked}
          />
          {/* @ts-expect-error Server/Client boundary handled in components */}
          <SaveButton
            storyId={s.id as string}
            initialSaved={reactions.saved}
          />
        </div>

        {/* Hero image */}
        {hero && (
          <figure className="not-prose my-4">
            <div className="relative w-full aspect-[16/9] overflow-hidden rounded-2xl ring-1 ring-black/5">
              <Image src={hero} alt={s.title} fill className="object-cover" />
            </div>
            <figcaption className="mt-1 text-sm text-neutral-500">
              Image credit: CC0/Stock
            </figcaption>
          </figure>
        )}

        {/* Sections */}
        {s.what && (<><h3>What happened</h3><p>{s.what}</p></>)}
        {s.how && (<><h3>How they acted</h3><p>{s.how}</p></>)}
        {s.why && (<><h3>Why it matters</h3><p>{s.why}</p></>)}
        {s.life_lesson && <p><strong>{s.life_lesson}</strong></p>}

        <hr />
        {/* Sources block (optional) */}
      </article>

      {/* Proof-of-Good panel (client-only) */}
<div className="container max-w-2xl mt-8">
  <ProofPanel storyId={s.id as string} />
</div>


      {/* Comments */}
      <div className="container max-w-2xl">
        {/* @ts-expect-error Comments is client/server split internally */}
        <Comments storyId={s.id as string} />
      </div>

      {/* Related slider */}
      <div className="container">
        {/* @ts-expect-error component typing local */}
        <RelatedCarousel current={s} all={related} />
      </div>
    </>
  );
}
