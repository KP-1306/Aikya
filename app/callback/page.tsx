"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Callback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Handles both OAuth and Magic Link
    supabase.auth
      .exchangeCodeForSession(window.location.href)
      .then(({ error }) => {
        if (error) setError(error.message);
        // Navigate home (or use search param `redirectTo`)
        router.replace("/");
      });
  }, [router]);

  return (
    <div className="p-8">
      <p>Signing you in…</p>
      {error && <p className="text-red-600 mt-3">Error: {error}</p>}
    </div>
  );
}
