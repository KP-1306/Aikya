// app/(auth)/callback/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const [msg, setMsg] = useState("Signing you in…");

  useEffect(() => {
    let canceled = false;

    async function run() {
      try {
        // 1) Exchange OAuth/magic-link code for a session
        const { error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );
        if (error) throw error;

        // 2) Ensure a profile row exists for this user
        const {
          data: { user },
          error: getUserErr,
        } = await supabase.auth.getUser();
        if (getUserErr) throw getUserErr;

        if (user) {
          await supabase
            .from("profiles")
            .upsert({ id: user.id }, { onConflict: "id" });
        }

        // 3) Redirect to home (or wherever)
        if (!canceled) window.location.replace("/");
      } catch (e: any) {
        if (!canceled) {
          setMsg(
            e?.message || "Something went wrong. You can close this window."
          );
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
