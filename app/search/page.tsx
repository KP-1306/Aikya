// app/search/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSearch } from "./useSearch";

export default function SearchPage() {
  const sp = useSearchParams();
  const initialQ = sp.get("q") ?? "";

  const [query, setQuery] = useState(initialQ);
  const inputRef = useRef<HTMLInputElement>(null);

  const { hits, loading, error, q } = useSearch(query, 12, 250);

  // keyboard navigation
  const [active, setActive] = useState(0);
  const max = hits.length;

  useEffect(() => {
    setActive(0);
  }, [q, max]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!max) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % max);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + max) % max);
    } else if (e.key === "Enter") {
      const h = hits[active];
      if (h) window.location.href = `/story/${h.slug}`;
    }
  };

  const header = useMemo(() => {
    if (!q) return "Search Aikya";
    if (loading) return `Searching “${q}”…`;
    if (hits.length === 0) return `No results for “${q}”`;
    return `Results for “${q}”`;
  }, [q, loading, hits.length]);

  return (
    <main className="container max-w-4xl py-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{header}</h1>
        <p className="text-sm text-neutral-600">
          Tip: try a city (“Pune”), a theme (“seaweed”), or a keyword (“bicycle”).
        </p>
      </header>

      <div className="relative">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search stories, places, keywords…"
          className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 pr-28 outline-none focus:ring-2 focus:ring-neutral-400"
          autoFocus
        />
        {q ? (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500 hover:text-neutral-700"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
          >
            Clear
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Results */}
      <ul className="grid gap-4 sm:grid-cols-2">
        {hits.map((s, idx) => (
          <li
            key={s.id}
            className={[
              "rounded-xl border bg-white overflow-hidden transition-shadow",
              idx === active ? "ring-2 ring-neutral-400 shadow" : "border-neutral-200",
            ].join(" ")}
          >
            <Link href={`/story/${s.slug}`} className="block">
              <div className="relative w-full aspect-[16/9] bg-neutral-100">
                {s.hero_image ? (
                  <Image
                    fill
                    src={s.hero_image}
                    alt={s.title}
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="p-4">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-neutral-600">
                  {s.city ? (
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5">
                      {s.city}
                    </span>
                  ) : null}
                  {s.state ? (
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5">
                      {s.state}
                    </span>
                  ) : null}
                  {s.read_minutes ? (
                    <span className="ml-auto">{s.read_minutes} min</span>
                  ) : null}
                </div>
                <h3 className="font-semibold line-clamp-2">{s.title}</h3>
                {s.dek ? (
                  <p className="mt-1 text-sm text-neutral-600 line-clamp-2">
                    {s.dek}
                  </p>
                ) : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {/* States: empty & loading */}
      {!loading && q && hits.length === 0 ? (
        <div className="text-sm text-neutral-600">
          No matches yet. Try a shorter keyword or a different city/state.
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm text-neutral-500">Searching…</div>
      ) : null}
    </main>
  );
}
