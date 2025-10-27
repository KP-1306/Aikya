"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

/**
 * Handles BOTH Supabase redirect styles:
 *  - /auth/callback?code=...                     (code/PKCE)
 *  - /auth/callback#access_token=...&...         (hash-token)
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    (async () => {
      const next = sp.get("next") || "/";

      // ?error / ?error_description in query
      const queryErr = sp.get("error_description") || sp.get("error");
      if (queryErr) {
        router.replace(`/signin?error=${encodeURIComponent(queryErr)}`);
        return;
      }

      // A) Code (PKCE) flow: /auth/callback?code=...
      const code = sp.get("code");
      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            router.replace(`/signin?error=${encodeURIComponent(error.message)}`);
            return;
          }
          router.replace(next);
          router.refresh();
          return;
        } catch (e) {
          router.replace(`/signin?error=${encodeURIComponent("auth_exchange_failed")}`);
          return;
        }
      }

      // B) Hash-token (magic link) flow: /auth/callback#access_token=...
      const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
      const hsp = new URLSearchParams(hash);
      const access_token = hsp.get("access_token");
      const refresh_token = hsp.get("refresh_token") ?? "";
      const hashErr = hsp.get("error_description");

      if (hashErr) {
        router.replace(`/signin?error=${encodeURIComponent(hashErr)}`);
        return;
      }

      if (access_token) {
        try {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) {
            router.replace(`/signin?error=${encodeURIComponent(error.message)}`);
            return;
          }
          // Clean the hash, then continue
          window.history.replaceState({}, "", window.location.pathname);
          router.replace(next);
          router.refresh();
          return;
        } catch (e) {
          router.replace(`/signin?error=${encodeURIComponent("auth_set_session_failed")}`);
          return;
        }
      }

      // C) Nothing usable → go home
      router.replace("/");
      router.refresh();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <main className="container py-10">Signing you in…</main>;
}
