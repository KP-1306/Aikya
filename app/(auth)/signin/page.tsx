"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const redirectTo =
    (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin) + "/callback";

  async function sendMagic() {
    setLoading(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    setLoading(false);
    setMsg(error ? error.message : "Check your email for a sign-in link.");
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) setMsg(error.message);
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow">
      <label className="block mb-2 text-sm font-medium">Email</label>
      <input
        type="email"
        className="w-full border rounded px-3 py-2 mb-4"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />

      <button
        type="button"
        onClick={sendMagic}
        disabled={!email || loading}
        className="w-full rounded bg-emerald-700 text-white py-2 disabled:opacity-50"
      >
        {loading ? "Sending..." : "Email me a magic link"}
      </button>

      <div className="my-4 text-center text-sm text-neutral-500">— or —</div>

      <button
        type="button"
        onClick={signInWithGoogle}
        className="w-full rounded border py-2"
      >
        Continue with Google
      </button>

      {msg && <p className="mt-4 text-sm text-neutral-700">{msg}</p>}
    </div>
  );
}
