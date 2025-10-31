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
        // (0) If the provider sent an error in the querystring
        const qpErr = search.get("error") || search.get("error_description");
        if (qpErr) {
          router.replace(`/auth/signin?error=${encodeURIComponent(qpErr)}`);
          return;
        }

        // (1) PKCE / OTP (new links): /auth/callback?code=...
        const code = search.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code); // v2 API
          if (error) throw error;

          // Clean ?code and other auth params from the URL
          const url = new URL(window.location.href);
          url.searchParams.delete("code");
          url.searchParams.delete("redirectTo");
          window.history.replaceState({}, "", url.toString());

          const to = (search.get("redirectTo") as string) || "/";
          router.replace(to);
          return;
        }

        // (2) Legacy hash magic link: /auth/callback#access_token=...&refresh_token=...
        const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
        const sp = new URLSearchParams(hash);
        const access_token = sp.get("access_token");
        const refresh_token = sp.get("refresh_token") ?? "";

        if (access_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) throw error;

          // Clean the hash
          const url = new URL(window.location.href);
          url.hash = "";
          window.history.replaceState({}, "", url.toString());

          const to = (search.get("redirectTo") as string) || "/";
          router.replace(to);
          return;
        }

        // (3) Nothing usable → bounce to sign-in
        router.replace(
          "/auth/signin?error=" +
            encodeURIComponent("No auth credentials found. Please request a new link.")
        );
      } catch (e: any) {
        router.replace(
          "/auth/signin?error=" + encodeURIComponent(e?.message || "Auth callback failed")
        );
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Signing you in…</h1>
      <p>
        You’ll be redirected automatically. If not,{" "}
        <a href="/auth/signin">continue to sign in</a>.
      </p>
    </main>
  );
}
