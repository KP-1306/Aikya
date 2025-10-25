// components/PageviewPing.tsx
"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function PageviewPing() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;

    const query = searchParams?.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    const payload = JSON.stringify({ kind: "pageview", path });

    // Prefer sendBeacon so pageview survives navigations/tab-close
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/track", blob);
      return;
    }

    // Fallback to fetch with abort signal
    const controller = new AbortController();
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
      signal: controller.signal,
    }).catch(() => {});

    return () => controller.abort();
  }, [pathname, searchParams]);

  return null;
}
