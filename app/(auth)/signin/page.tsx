// app/(auth)/signin/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signInWithEmailPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setNotice(null); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    setLoading(false);
    if (error) setError(error.message);
    else window.location.href = "/";
  }

  async function sendMagicLink() {
    setError(null); setNotice(null); setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    });
    setLoading(false);
    if (error) setError(error.message);
    else setNotice("Check your inbox for a sign-in link.");
  }

  async function signInWithGoogle() {
    setError(null); setNotice(null);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  }

  return (
    <div className="container max-w-md py-12">
      <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
      <p className="text-neutral-600 mb-6">Sign in to post comments and save stories.</p>

      <div className="card p-6 space-y-4">
        {error && <div className="rounded-md bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}
        {notice && <div className="rounded-md bg-green-50 text-green-700 px-3 py-2 text-sm">{notice}</div>}

        <form className="space-y-3" onSubmit={signInWithEmailPassword}>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email" required value={email} onChange={(e)=>setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password" required value={pass} onChange={(e)=>setPass(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </div>
          <button disabled={loading} className="btn-primary w-full justify-center">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="text-center text-sm text-neutral-500">— or —</div>

        <button onClick={sendMagicLink} disabled={!email || loading} className="btn w-full justify-center border">
          Email me a magic link
        </button>

        <button onClick={signInWithGoogle} className="btn w-full justify-center border">
          Continue with Google
        </button>

        <p className="text-sm text-neutral-600">
          Don’t have an account?{" "}
          <Link href="/signup" className="underline underline-offset-2">Create one</Link>
        </p>
      </div>
    </div>
  );
}
