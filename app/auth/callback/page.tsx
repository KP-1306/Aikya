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
        // 0) If provider sent an error
        const qpErr = search.get("error") || search.get("error_description");
        if (qpErr) {
          router.replace(`/auth/signin?error=${encodeURIComponent(qpErr)}`);
          return;
        }

        // 1) Preferred: let supabase parse the URL and complete the session
        //    Works for PKCE (code+verifier) and for legacy hash links.
        try {
          const { data, error } = await supabase.auth.getSessionFromUrl({
            storeSession: true,
          });
          if (!error && data?.session) {
            const to = search.get("redirectTo") || "/";
            router.replace(to);
            return;
          }
        } catch {
          // fall through to manual paths below
        }

        // 2) Manual PKCE fallback (some older @supabase/supabase-js versions)
        const code = search.get("code");
        if (code) {
          // Some versions expect a string; others accept { code } — try string:
          const { error } = await supabase.auth.exchangeCodeForSession(code as string);
          if (!error) {
            const to = search.get("redirectTo") || "/";
            router.replace(to);
            return;
          }
        }

        // 3) Legacy hash-token fallback (very old magic links)
        const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
        const sp = new URLSearchParams(hash);
        const access_token = sp.get("access_token");
        const refresh_token = sp.get("refresh_token") ?? "";
        if (access_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (!error) {
            const to = search.get("redirectTo") || "/";
            router.replace(to);
            return;
          }
        }

        // 4) Nothing usable → bounce to sign-in
        router.replace(
          "/auth/signin?error=" +
            encodeURIComponent("No auth credentials found. Please request a new link.")
        );
      } catch (e: any) {
        router.replace("/auth/signin?error=" + encodeURIComponent(e?.message || "Unexpected error"));
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
