// components/PrefetchStories.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Props = {
  hrefs: string[];
  max?: number; // cap to avoid aggressive prefetching
};

export default function PrefetchStories({ hrefs, max = 24 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ref.current || ready) return;
    const el = ref.current;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setReady(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" } // start a bit early
    );

    io.observe(el);
    return () => io.disconnect();
  }, [ready]);

  // When ready=true we render hidden <Link prefetch> elements.
  const list = hrefs.slice(0, max);

  return (
    <div ref={ref}>
      {ready && (
        <div className="sr-only">
          {list.map((h) => (
            <Link key={h} href={h} prefetch aria-hidden="true">
              {h}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
