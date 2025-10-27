// app/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function CallbackPage() {
  const router = useRouter();
  const search = useSearchParams();

  useEffect(() => {
    (async () => {
      try {
        // 1) If Supabase sent tokens in the URL hash (#access_token=…)
        const hash = window.location.hash?.slice(1) ?? "";
        if (hash) {
          const params = new URLSearchParams(hash);
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token") ?? undefined;
          const error = params.get("error_description");

          if (error) {
            router.replace(`/signin?error=${encodeURIComponent(error)}`);
            return;
          }
          if (access_token) {
            const { error: setErr } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (setErr) {
              router.replace(`/signin?error=${encodeURIComponent(setErr.message)}`);
              return;
            }
            window.history.replaceState({}, "", window.location.pathname);
            router.replace("/");
            return;
          }
        }

        // 2) If it’s an email-confirmation or PKCE code flow (?code=…)
        const code = search.get("code");
        if (code) {
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exErr) {
            router.replace(`/signin?error=${encodeURIComponent(exErr.message)}`);
            return;
          }
          router.replace("/");
          return;
        }

        // 3) Nothing to process — go home
        router.replace("/");
      } catch {
        router.replace("/signin?error=callback_failed");
      }
    })();
  }, [router, search]);

  return (
    <main className="container py-10">
      <p>Signing you in…</p>
    </main>
  );
}
