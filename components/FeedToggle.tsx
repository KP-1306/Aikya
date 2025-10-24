"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function FeedToggle({ hasLocal }: { hasLocal: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const mode = sp.get("mode") || (hasLocal ? "local" : "all"); // default to local if available

  function setMode(next: "local" | "all") {
    const params = new URLSearchParams(sp);
    if (next === "local") params.set("mode", "local");
    else params.set("mode", "all");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="inline-flex rounded-full border bg-white p-1 text-sm">
      <button
        className={`px-3 py-1.5 rounded-full ${mode === "local" ? "bg-brand text-white" : ""}`}
        onClick={() => setMode("local")}
        disabled={!hasLocal}
        title={hasLocal ? "Show news from your state" : "Set your state in Account to enable Local"}
      >
        Local
      </button>
      <button
        className={`px-3 py-1.5 rounded-full ${mode === "all" ? "bg-brand text-white" : ""}`}
        onClick={() => setMode("all")}
        title="Show news from all over India"
      >
        All
      </button>
    </div>
  );
}
