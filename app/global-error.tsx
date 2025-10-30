// app/global-error.tsx
"use client";

import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-lg text-center space-y-4">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-neutral-600">{error.message || "Unexpected error"}</p>
          <div className="flex items-center justify-center gap-3">
            <button className="btn" onClick={() => reset()}>Try again</button>
            <Link className="btn-secondary" href="/">Go home</Link>
          </div>
        </div>
      </body>
    </html>
  );
}
