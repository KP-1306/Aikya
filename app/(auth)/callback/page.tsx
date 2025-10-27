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
    (async () => {
      try {
        const url = new URL(window.location.href);

        // 1) OAuth PKCE / SSO returns ?code=...&... (no hash)
        const code = url.searchParams.get("code");
        const errorDesc = url.searchParams.get("error_description");

        if (errorDesc) {
          // e.g., user closed Google screen, invalid/expired link, etc.
          router.replace(`/signin?error=${encodeURIComponent(errorDesc)}`);
          return;
        }

        if (code) {
          // Newer flow: exchange the code for a session
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            router.replace(`/signin?error=${encodeURIComponent(error.message)}`);
            return;
          }
          // Clean the URL (remove query params)
          window.history.replaceState({}, "", `${url.origin}${url.pathname}`);
          router.replace("/");
          return;
        }

        // 2) Email magic-link / OTP flow returns tokens in URL *hash*
        const hash = url.hash.startsWith("#") ? url.hash.slice(1) : "";
        const sp = new URLSearchParams(hash);
        const access_token = sp.get("access_token");
        const refresh_token = sp.get("refresh_token") ?? "";
        const hashError = sp.get("error_description");

        if (hashError) {
          router.replace(`/signin?error=${encodeURIComponent(hashError)}`);
          return;
        }

        if (access_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) {
            router.replace(`/signin?error=${encodeURIComponent(error.message)}`);
            return;
          }
          // Clean the URL (remove hash)
          window.history.replaceState({}, "", `${url.origin}${url.pathname}`);
          router.replace("/");
          return;
        }

        // 3) Nothing to do -> go home
        router.replace("/");
      } catch (e: any) {
        router.replace(`/signin?error=${encodeURIComponent(e?.message ?? "auth_callback_failed")}`);
      }
    })();
  }, [router]);

  return (
    <main className="container py-10">
      <p>Signing you in…</p>
    </main>
  );
}
