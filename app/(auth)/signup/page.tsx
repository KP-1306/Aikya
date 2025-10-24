// app/(auth)/signup/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function SignUpPage() {
  const [fullName, setFullName] = useState("");
  const [state, setState] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setNotice(null); setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    });

    if (error) { setLoading(false); setError(error.message); return; }

    // If email confirmation is off, we may already have a session.
    // Try to insert/update profile optimistically.
    const user = data.user;
    if (user) {
      await supabase.from("profiles").upsert({ id: user.id, full_name: fullName, state });
    }

    setLoading(false);
    setNotice("Check your email to confirm your account. After confirming, you’ll be redirected.");
  }

  async function signUpWithGoogle() {
    setError(null); setNotice(null);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  }

  return (
    <div className="container max-w-md py-12">
      <h1 className="text-2xl font-bold mb-1">Create your account</h1>
      <p className="text-neutral-600 mb-6">Join Aikya to comment and personalize your feed.</p>

      <div className="card p-6 space-y-4">
        {error && <div className="rounded-md bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}
        {notice && <div className="rounded-md bg-green-50 text-green-700 px-3 py-2 text-sm">{notice}</div>}

        <form className="space-y-3" onSubmit={signUp}>
          <div>
            <label className="block text-sm font-medium">Full name</label>
            <input
              type="text" value={fullName} onChange={(e)=>setFullName(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">State (for local news)</label>
            <input
              type="text" value={state} onChange={(e)=>setState(e.target.value)}
              placeholder="e.g., Uttarakhand"
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </div>
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

        <div className="text-center text-sm text-neutral-500">— or —</div>

        <button onClick={signUpWithGoogle} className="btn w-full justify-center border">
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
