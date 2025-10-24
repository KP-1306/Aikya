"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function FeedToggle({
  hasCity,
  hasState,
}: {
  hasCity: boolean;
  hasState: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // Default: city if available, else state, else all
  const mode = (sp.get("mode") as "city" | "state" | "all") ||
    (hasCity ? "city" : hasState ? "state" : "all");

  function setMode(next: "city" | "state" | "all") {
    const params = new URLSearchParams(sp);
    params.set("mode", next);
    router.push(`${pathname}?${params.toString()}`);
  }

  const btn = "px-3 py-1.5 rounded-full";
  const active = "bg-brand text-white";
  const disabled = "opacity-50 cursor-not-allowed";

  return (
    <div className="inline-flex rounded-full border bg-white p-1 text-sm">
      <button
        className={`${btn} ${mode === "city" ? active : ""} ${!hasCity ? disabled : ""}`}
        onClick={() => hasCity && setMode("city")}
        disabled={!hasCity}
        title={hasCity ? "Show news from your city" : "Set your City in Account to enable"}
      >
        City
      </button>
      <button
        className={`${btn} ${mode === "state" ? active : ""} ${!hasState ? disabled : ""}`}
        onClick={() => hasState && setMode("state")}
        disabled={!hasState}
        title={hasState ? "Show news from your state" : "Set your State in Account to enable"}
      >
        State
      </button>
      <button
        className={`${btn} ${mode === "all" ? active : ""}`}
        onClick={() => setMode("all")}
        title="Show news from all over India"
      >
        All
      </button>
    </div>
  );
}
