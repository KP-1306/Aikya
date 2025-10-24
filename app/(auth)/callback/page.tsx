// app/auth/callback/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const [msg, setMsg] = useState("Signing you in…");

  useEffect(() => {
    async function run() {
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) throw error;

        // Create profile on first login (Google/magic link)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id" });
        }
        window.location.replace("/");
      } catch (e: any) {
        setMsg(e?.message || "Something went wrong. You can close this window.");
      }
    }
    run();
  }, []);

  return (
    <div className="container max-w-md py-24 text-center">
      <div className="card p-8">
        <div className="animate-pulse text-sm text-neutral-600">{msg}</div>
      </div>
    </div>
  );
}
