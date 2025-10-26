"use client";

import { useState } from "react";
import Link from "next/link";
// NOTE: use relative path (adjust depth to your repo layout)
import { supabase } from "../../../lib/supabase/client";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setNotice(null); setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    setLoading(false);
    if (error) setError(error.message);
    else setNotice("Check your inbox to confirm your email.");
  }

  return (
    <div className="container max-w-md py-12">
      <h1 className="text-2xl font-bold mb-1">Create your account</h1>
      <p className="text-neutral-600 mb-6">Sign up to comment and save stories.</p>

      <div className="card p-6 space-y-4">
        {error && <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}
        {notice && <div className="rounded bg-green-50 text-green-700 px-3 py-2 text-sm">{notice}</div>}

        <form className="space-y-3" onSubmit={createAccount}>
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
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <hr className="my-2" />
        <button
          onClick={() =>
            supabase.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo: `${window.location.origin}/auth/callback` },
            })
          }
          className="btn w-full justify-center border"
        >
          Continue with Google
        </button>

        <p className="text-sm text-neutral-600">
          Already have an account?{" "}
          <Link href="/signin" className="underline underline-offset-2">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
