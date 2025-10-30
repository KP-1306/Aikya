// app/search/useSearch.ts
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type SearchHit = {
  id: string;
  slug: string;
  title: string;
  dek: string | null;
  city: string | null;
  state: string | null;
  hero_image: string | null;
  read_minutes: number | null;
};

export function useSearch(query: string, limit = 12, debounceMs = 250) {
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const ctrl = useRef<AbortController | null>(null);

  const q = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);

    if (!q) {
      setHits([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    timer.current = window.setTimeout(async () => {
      ctrl.current?.abort();
      ctrl.current = new AbortController();

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=${limit}`, {
          signal: ctrl.current.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setHits(Array.isArray(json?.data) ? json.data : []);
      } catch (e: any) {
        if (e?.name === "AbortError") return; // ignore
        setError(e?.message || "Search failed");
        setHits([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
      ctrl.current?.abort();
    };
  }, [q, limit, debounceMs]);

  return { hits, loading, error, q };
}
