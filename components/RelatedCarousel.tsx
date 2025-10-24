// components/RelatedCarousel.tsx
"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Story } from "@/lib/types";

type Props = {
  current: Story;
  all: Story[];
};

/**
 * A lightweight horizontal carousel using native scroll + snap.
 * No external deps. Works great on mobile (swipe) and desktop (arrows).
 */
export default function RelatedCarousel({ current, all }: Props) {
  // rank related: same state > same category > same country; exclude self
  const items = useMemo(() => {
    const scored = all
      .filter((s) => s.id !== current.id)
      .map((s) => {
        let score = 0;
        if (current.state && s.state && current.state === s.state) score += 5;
        if (current.category === s.category) score += 3;
        if (!current.state && s.city && current.city && current.city === s.city) score += 2;
        if (current.country === s.country) score += 1;
        return { s, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((x) => x.s);
    return scored;
  }, [all, current]);

  if (!items.length) return null;

  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollBy = (dx: number) => {
    scrollerRef.current?.scrollBy({ left: dx, behavior: "smooth" });
  };

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Related stories near you</h2>
        <div className="hidden sm:flex gap-2">
          <button aria-label="Scroll left" className="carousel-btn" onClick={() => scrollBy(-360)}>
            ‹
          </button>
          <button aria-label="Scroll right" className="carousel-btn" onClick={() => scrollBy(360)}>
            ›
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="snap-x snap-mandatory overflow-x-auto no-scrollbar -mx-4 px-4"
      >
        <ul className="flex gap-4 pb-2">
          {items.map((s) => (
            <li key={s.id} className="snap-start shrink-0 w-[250px]">
              <Link
                href={`/story/${s.slug}`}
                className="block rounded-2xl border border-neutral-200/70 bg-white hover:shadow-md transition-shadow"
                prefetch={false}
              >
                <div className="relative h-[140px] overflow-hidden rounded-t-2xl">
                  {s.heroImage ? (
                    <Image
                      src={s.heroImage}
                      alt={s.title}
                      fill
                      className="object-cover"
                      sizes="250px"
                    />
                  ) : (
                    <div className="h-full w-full bg-neutral-100" />
                  )}
                </div>
                <div className="p-3">
                  <div className="text-xs text-neutral-500">
                    {s.city ?? s.state ?? s.country} • {s.readMinutes} min
                  </div>
                  <h3 className="mt-1 text-sm font-semibold leading-snug line-clamp-2">
                    {s.title}
                  </h3>
                  <div className="mt-1 text-[12px] inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5">
                    {prettyCategory(s.category)}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function prettyCategory(c: Story["category"]) {
  switch (c) {
    case "ActsOfKindness":
      return "Kindness";
    case "BraveryRescue":
      return "Bravery";
    case "Innovation":
      return "Innovation";
    case "Environment":
      return "Environment";
    case "GlobalHope":
      return "Global";
    case "Wisdom":
      return "Wisdom";
  }
}
