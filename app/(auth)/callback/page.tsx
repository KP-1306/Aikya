// app/(auth)/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// Browser client for Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    let done = false;

    const run = async () => {
      // 0) If Supabase passed back an error, surface it and bounce to /signin
      //    (Supabase uses either the hash or the query string)
      const { location } = window;
      const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
      const qs = new URLSearchParams(location.search);
      const err =
        hash.get("error_description") ||
        hash.get("error") ||
        qs.get("error_description") ||
        qs.get("error");
      if (err) {
        router.replace(`/signin?error=${encodeURIComponent(err)}`);
        return;
      }

      try {
        // 1) Magic link / email OTP (implicit): tokens are in the URL hash.
        //    This stores the session and removes the hash from the URL.
        const { error } = await supabase.auth.getSessionFromUrl({
          storeSession: true,
        });
        if (!error) {
          done = true;
        }
      } catch {
        // ignore — move on to OAuth exchange
      }

      try {
        // 2) OAuth (PKCE): ?code=... in the query string.
        //    This exchanges the code for a session and cleans the URL.
        const { error } = await supabase.auth.exchangeCodeForSession();
        if (!error) {
          done = true;
        }
      } catch {
        // ignore — if neither flow matched, we'll just go home
      }

      // 3) Fall-through: go home (or change to your desired post-login page)
      router.replace("/");
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="container py-10">
      <p>Signing you in…</p>
    </main>
  );
}
