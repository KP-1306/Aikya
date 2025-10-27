"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Supabase sends tokens in the URL hash: #access_token=...&refresh_token=...&error_description=...
    const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    const sp = new URLSearchParams(hash);

    const error = sp.get("error_description");
    const access_token = sp.get("access_token");
    const refresh_token = sp.get("refresh_token") ?? "";

    if (error) {
      console.error("Auth error:", error);
      router.replace(`/signin?error=${encodeURIComponent(error)}`);
      return;
    }

    if (access_token) {
      // Store the session in Supabase (completes the magic-link / OAuth flow)
      supabase.auth
        .setSession({ access_token, refresh_token })
        .then(() => router.replace("/"))
        .catch(() => router.replace("/signin?error=auth_set_session_failed"));
      return;
    }

    // Nothing in URL hash – just go home
    router.replace("/");
  }, [router]);

  return (
    <main className="container py-10">
      <p>Signing you in…</p>
    </main>
  );
}
