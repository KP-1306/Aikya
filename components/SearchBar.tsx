"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SearchBar() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const placeholder = "Search uplifting stories…";
  const nextUrl = useMemo(() => {
    const sp = new URLSearchParams(searchParams.toString());
    if (q) sp.set("q", q); else sp.delete("q");
    sp.delete("page");
    return `/?${sp.toString()}`;
  }, [q, searchParams]);

  // Submit on Enter; debounce on blur/click
  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    router.push(nextUrl);
    setBusy(false);
  }

  useEffect(() => setQ(searchParams.get("q") || ""), [searchParams]);

  return (
    <form ref={formRef} onSubmit={onSubmit} className="relative w-full max-w-xl">
      <div className="group flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500">
        <svg aria-hidden className="h-5 w-5 opacity-60" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.9 14.32a8 8 0 111.414-1.414l4.387 4.387-1.414 1.414-4.387-4.387zM14 8a6 6 0 11-12 0 6 6 0 0112 0z" clipRule="evenodd"/>
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none placeholder:text-neutral-400"
          aria-label="Search"
        />
        <button
          type="submit"
          className="rounded-xl px-3 py-1.5 text-sm font-medium ring-1 ring-black/10 hover:bg-neutral-50"
          disabled={busy}
        >
          {busy ? "Searching…" : "Search"}
        </button>
      </div>
    </form>
  );
}
