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
      // (A) Email magic link (hash fragment with access_token / refresh_token)
      const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
      const sp = new URLSearchParams(hash);
      const access_token = sp.get("access_token");
      const refresh_token = sp.get("refresh_token") ?? "";
      const error = sp.get("error_description");

      if (error) {
        router.replace(`/signin?error=${encodeURIComponent(error)}`);
        return;
      }

      if (access_token) {
        try {
          await supabase.auth.setSession({ access_token, refresh_token });
        } catch {
          // ignore, we'll drop to the signin page below if it fails
        }
        // clean the hash and refresh SSR parts
        window.history.replaceState({}, "", window.location.pathname);
        router.replace("/");
        router.refresh();
        return;
      }

      // (B) Nothing to do: just go home
      router.replace("/");
      router.refresh();
    })();
  }, [router]);

  return (
    <main className="container py-10">
      <p>Signing you in…</p>
    </main>
  );
}
