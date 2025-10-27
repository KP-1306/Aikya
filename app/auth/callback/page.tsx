"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function CallbackPage() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    (async () => {
      // 1) Prioritize MAGIC LINK HASH flow (email)
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
          if (error) throw error;
          // Clean the hash then land at home
          window.history.replaceState({}, "", window.location.pathname);
          router.replace("/");
          router.refresh();
          return;
        } catch (e: any) {
          router.replace(`/signin?error=${encodeURIComponent(e?.message || "auth_set_session_failed")}`);
          return;
        }
      }

      // 2) PKCE “code” flow (OAuth) ONLY if we have a stored verifier
      const code = sp.get("code");
      const err = sp.get("error_description") || sp.get("error");

      if (err) {
        router.replace(`/signin?error=${encodeURIComponent(err)}`);
        return;
      }

      // Supabase stores a pkce verifier key in web storage; check loosely
      const hasPkceVerifier =
        typeof window !== "undefined" &&
        (localStorage.getItem("sb-pkce-code-verifier") ||
          sessionStorage.getItem("sb-pkce-code-verifier") ||
          Object.keys(localStorage).some((k) => k.includes("pkce") && k.includes("verifier")) ||
          Object.keys(sessionStorage).some((k) => k.includes("pkce") && k.includes("verifier")));

      if (code && hasPkceVerifier) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          router.replace("/");
          router.refresh();
          return;
        } catch (e: any) {
          // If this fails due to missing verifier, send back to signin with a clean message
          router.replace(`/signin?error=${encodeURIComponent("Sign-in link invalid or expired. Try again.")}`);
          return;
        }
      }

      // 3) Nothing usable → go home
      router.replace("/");
      router.refresh();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <main className="container py-10">Signing you in…</main>;
}
