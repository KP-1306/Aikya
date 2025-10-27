"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SignInPage() {
  const router = useRouter();
  const q = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<null | "pwd" | "magic" | "google">(null);
  const [message, setMessage] = useState<string | null>(q.get("error") || null);

  // Where Supabase should send users back after auth
  const redirectTo = useMemo(() => {
    const base =
      process.env.NEXT_PUBLIC_SITE_URL ??
      (typeof window !== "undefined" ? window.location.origin : "");
    return `${base}/callback`;
  }, []);

  const handlePassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setMessage(null);
      setLoading("pwd");
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(null);
      if (error) return setMessage(error.message);
      router.replace("/"); // signed in
    },
    [email, password, router]
  );

  const handleMagicLink = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setMessage(null);
      setLoading("magic");
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });
      setLoading(null);
      if (error) return setMessage(error.message);
      setMessage("Check your email for a sign-in link.");
    },
    [email, redirectTo]
  );

  const handleGoogle = useCallback(async () => {
    setMessage(null);
    setLoading("google");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    // If OAuth opens a new window, this code may not continue here.
    if (error) {
      setLoading(null);
      setMessage(error.message);
    }
  }, [redirectTo]);

  return (
    <main className="container max-w-md mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-6">Welcome back</h1>

      {message && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {message}
        </div>
      )}

      <form onSubmit={handlePassword} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Your password"
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading !== null}
          className="w-full rounded-md bg-emerald-600 px-4 py-2 text-white disabled:opacity-60"
        >
          {loading === "pwd" ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-sm text-neutral-500">
        <span className="h-px flex-1 bg-neutral-200" />
        or
        <span className="h-px flex-1 bg-neutral-200" />
      </div>

      {/* Magic link */}
      <form onSubmit={handleMagicLink}>
        <button
          type="submit"
          disabled={!email || loading !== null}
          className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-neutral-800 hover:bg-neutral-50 disabled:opacity-60"
          title={!email ? "Enter your email above first" : "Send me a magic link"}
        >
          {loading === "magic" ? "Sending link…" : "Email me a magic link"}
        </button>
      </form>

      {/* Google OAuth */}
      <button
        onClick={handleGoogle}
        disabled={loading !== null}
        className="mt-3 w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-neutral-800 hover:bg-neutral-50 disabled:opacity-60"
      >
        {loading === "google" ? "Opening Google…" : "Continue with Google"}
      </button>

      <p className="mt-6 text-sm text-neutral-600">
        Don’t have an account? <a href="/signup" className="underline">Create one</a>
      </p>
    </main>
  );
}
