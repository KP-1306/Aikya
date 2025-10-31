// app/(auth)/signup/page.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function SignUpPage() {
  const q = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<null | "password" | "magic">(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Where to send the user AFTER the callback succeeds
  const redirectAfter = useMemo(() => q.get("redirectTo") || "/", [q]);

  // Absolute origin for email redirect (env → window fallback)
  const origin = useMemo(
    () =>
      (process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "")) ||
      (typeof window !== "undefined" ? window.location.origin : ""),
    []
  );

  // The URL Supabase should open from the email → our callback page
  // The callback will exchange the code and then forward to redirectAfter.
  const emailRedirectTo = useMemo(
    () => `${origin}/auth/callback?redirectTo=${encodeURIComponent(redirectAfter)}`,
    [origin, redirectAfter]
  );

  async function onPasswordSignup(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setLoading("password");

    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { emailRedirectTo }, // confirm email → returns to /auth/callback
    });

    setLoading(null);
    if (error) setErr(error.message);
    else setMsg("Account created. Check your email to confirm your address.");
  }

  async function onMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setLoading("magic");

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo,        // land on /auth/callback, then forward to redirectAfter
        shouldCreateUser: true, // allow creating the user from the link
      },
    });

    setLoading(null);
    if (error) setErr(error.message);
    else setMsg("Magic link sent. Check your inbox to finish signing up.");
  }

  return (
    <main className="container max-w-md mx-auto py-12">
      <h1 className="text-2xl font-bold mb-1">Create your account</h1>
      <p className="text-neutral-600 mb-6">Sign up to comment and save stories.</p>

      {err && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {err}
        </div>
      )}
      {msg && (
        <div className="mb-4 rounded border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
          {msg}
        </div>
      )}

      {/* Email + Password sign up */}
      <form onSubmit={onPasswordSignup} className="space-y-4">
        <div>
          <label className="block text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Create a password"
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading !== null}
          className="w-full rounded-md bg-emerald-600 px-4 py-2 text-white disabled:opacity-60"
        >
          {loading === "password" ? "Creating…" : "Create account"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-sm text-neutral-500">
        <span className="h-px flex-1 bg-neutral-200" />
        or
        <span className="h-px flex-1 bg-neutral-200" />
      </div>

      {/* Magic link sign up */}
      <form onSubmit={onMagicLink}>
        <button
          type="submit"
          disabled={!email || loading !== null}
          className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-neutral-800 hover:bg-neutral-50 disabled:opacity-60"
          title={!email ? "Enter your email above first" : "Send me a magic link"}
        >
          {loading === "magic" ? "Sending link…" : "Email me a magic link"}
        </button>
      </form>

      <p className="mt-6 text-sm text-neutral-600">
        Already have an account?{" "}
        <Link href={`/signin?redirectTo=${encodeURIComponent(redirectAfter)}`} className="underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
