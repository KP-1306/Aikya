// app/error.tsx
"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Best-effort Sentry capture if loaded
    (async () => {
      try {
        const Sentry = await import("@sentry/nextjs");
        Sentry.captureException(error);
      } catch {
        // ignore
      }
    })();
  }, [error]);

  return (
    <main className="container py-16 space-y-4">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-neutral-600">
        We hit a snag while loading this page. You can try again, or head back home.
      </p>
      <div className="flex gap-3">
        <button onClick={reset} className="btn">Try again</button>
        <Link href="/" className="btn-secondary">Go home</Link>
      </div>
      {error?.digest ? (
        <p className="text-xs text-neutral-400">Ref: {error.digest}</p>
      ) : null}
    </main>
  );
}
