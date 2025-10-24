// app/auth/callback/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

// Optional: prevent this page from being indexed
export const metadata = {
  robots: { index: false, follow: false },
};

export default function AuthCallbackPage() {
  const [msg, setMsg] = useState("Signing you in…");

  useEffect(() => {
    let canceled = false;

    async function run() {
      try {
        // 1) Exchange the OAuth/magic-link code for a session
        const { error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );
        if (error) throw error;

        // 2) Ensure a profile row exists for this user
        const { data: { user }, error: getUserErr } = await supabase.auth.getUser();
        if (getUserErr) throw getUserErr;

        if (user) {
          // Upsert creates if missing; safe to call on every login
          // If your table has more columns, include them here
          await supabase.from("profiles").upsert(
            { id: user.id },
            { onConflict: "id" }
          );
        }

        // 3) Bounce to home (or wherever you want)
        if (!canceled) window.location.replace("/");
      } catch (e: any) {
        if (!canceled) {
          setMsg(e?.message || "Something went wrong. You can close this window.");
        }
      }
    }

    run();
    return () => {
      canceled = true;
    };
  }, []);

  return (
    <div className="container max-w-md py-24 text-center">
      <div className="card p-8">
        <div className="animate-pulse text-sm text-neutral-600">{msg}</div>
      </div>
    </div>
  );
}
