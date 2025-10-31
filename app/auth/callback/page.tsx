// app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CallbackPage() {
  const router = useRouter();
  const search = useSearchParams();

  useEffect(() => {
    (async () => {
      try {
        const redirectTo = search.get("redirectTo") || "/";

        // (A) Provider or magic-link error (either in query or hash)
        const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
        const hp = new URLSearchParams(hash);
        const err =
          search.get("error") ||
          search.get("error_description") ||
          hp.get("error") ||
          hp.get("error_description");
        if (err) {
          router.replace(`/signin?error=${encodeURIComponent(err)}`);
          return;
        }

        // (B) Modern PKCE / OAuth / magic-link (code in the query)
        const code = search.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code); // <-- string, not object
          if (error) {
            router.replace(`/signin?error=${encodeURIComponent(error.message)}`);
            return;
          }
          router.replace(redirectTo);
          return;
        }

        // (C) Legacy hash-token email links (older format)
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

        // (D) Nothing usable present
        router.replace(
          "/signin?error=" +
            encodeURIComponent("No auth credentials found. Please sign in again.")
        );
      } catch (e: any) {
        router.replace("/signin?error=" + encodeURIComponent(e?.message || "Unexpected error"));
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
