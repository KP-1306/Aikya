// components/Analytics.tsx
"use client";

import { useEffect } from "react";

export default function Analytics() {
  // Sentry (optional)
  useEffect(() => {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) return;

    (async () => {
      try {
        const Sentry = await import("@sentry/nextjs");
        Sentry.init({
          dsn,
          tracesSampleRate: 0.1,         // light sampling
          replaysSessionSampleRate: 0.0, // turn on later if needed
        });
      } catch {
        // ignore init errors
      }
    })();
  }, []);

  // Plausible (handled via script tag in layout; nothing to do here)
  return null;
}
