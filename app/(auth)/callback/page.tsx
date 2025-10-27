"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
      const sp = new URLSearchParams(hash);

      const error = sp.get("error_description");
      const access_token = sp.get("access_token");
      const refresh_token = sp.get("refresh_token") ?? "";

      if (error) {
        router.replace(`/signin?error=${encodeURIComponent(error)}`);
        return;
      }

      if (access_token) {
        try {
          await supabase.auth.setSession({ access_token, refresh_token });
        } catch {
          router.replace("/signin?error=auth_set_session_failed");
          return;
        }

        // Clean URL and make sure server sees the cookie
        window.history.replaceState({}, "", window.location.pathname);
        router.replace("/");
        router.refresh();
        return;
      }

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
