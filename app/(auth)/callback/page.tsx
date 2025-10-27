"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function CallbackPage() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    (async () => {
      // --- A) PKCE / code flow (e.g., some email or OAuth setups) ---
      const code = sp.get("code");
      const error = sp.get("error_description") || sp.get("error");

      if (error) {
        router.replace(`/signin?error=${encodeURIComponent(error)}`);
        return;
      }

      if (code) {
        try {
          // If a code exists in the query, exchange it for a session
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exErr) {
            router.replace(`/signin?error=${encodeURIComponent(exErr.message)}`);
            return;
          }
          router.replace("/");
          router.refresh();
          return;
        } catch {
          router.replace(`/signin?error=auth_exchange_failed`);
          return;
        }
      }

      // --- B) Magic link (implicit) with tokens in the URL hash (#access_token=...) ---
      const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
      const hsp = new URLSearchParams(hash);
      const access_token = hsp.get("access_token");
      const refresh_token = hsp.get("refresh_token") ?? "";
      const hashError = hsp.get("error_description");

      if (hashError) {
        router.replace(`/signin?error=${encodeURIComponent(hashError)}`);
        return;
      }

      if (access_token) {
        try {
          await supabase.auth.setSession({ access_token, refresh_token });
          // clean the hash
          window.history.replaceState({}, "", window.location.pathname);
          router.replace("/");
          router.refresh();
          return;
        } catch {
          router.replace(`/signin?error=auth_set_session_failed`);
          return;
        }
      }

      // --- C) Nothing found: just go home ---
      router.replace("/");
      router.refresh();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="container py-10">
      <p>Signing you in…</p>
    </main>
  );
}
