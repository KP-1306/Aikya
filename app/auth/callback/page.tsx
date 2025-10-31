// app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // We'll parse the URL ourselves below to support both flows.
      detectSessionInUrl: false,
    },
  }
);

export default function CallbackPage() {
  const router = useRouter();
  const search = useSearchParams();

  useEffect(() => {
    (async () => {
      try {
        // --- Helpers ---
        const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
        const hp = new URLSearchParams(hash);

        // Normalize a safe redirect target (avoid open-redirects)
        const rawRedirect = search.get("redirectTo") || "/";
        const redirectTo = rawRedirect.startsWith("/") ? rawRedirect : "/";

        // 1) Provider/magic-link error surfaced in query or hash
        const qpErr = search.get("error") || search.get("error_description");
        const hpErr = hp.get("error") || hp.get("error_description");
        const err = qpErr || hpErr;
        if (err) {
          router.replace(`/signin?error=${encodeURIComponent(err)}`);
          return;
        }

        // 2) New PKCE flow (?code=...)
        const code = search.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession({ code });
          if (error) {
            router.replace(`/signin?error=${encodeURIComponent(error.message)}`);
            return;
          }
          router.replace(redirectTo);
          return;
        }

        // 3) Legacy hash-token flow (#access_token=...&refresh_token=...)
        const access_token = hp.get("access_token");
        const refresh_token = hp.get("refresh_token") ?? "";
        if (access_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) {
            router.replace(`/signin?error=${encodeURIComponent(error.message)}`);
            return;
          }
          router.replace(redirectTo);
          return;
        }

        // 4) Nothing usable → bounce to signin with a friendly note
        router.replace(
          "/signin?error=" +
            encodeURIComponent("No auth credentials found. Please sign in again.")
        );
      } catch (e: any) {
        router.replace("/signin?error=" + encodeURIComponent(e?.message || "Sign-in failed"));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Signing you in…</h1>
      <p>
        You’ll be redirected automatically. If not,{" "}
        <a href="/signin">continue to sign in</a>.
      </p>
    </main>
  );
}
