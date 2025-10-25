"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function PageviewPing() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({ kind: "pageview", path: pathname }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
