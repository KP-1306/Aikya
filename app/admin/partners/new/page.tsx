// app/admin/partners/new/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";

export default function NewPartnerPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [upi, setUpi] = useState("");
  const [scopesText, setScopesText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Parse comma-separated scopes → string[]
  const scopes = useMemo(
    () =>
      scopesText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [scopesText]
  );

  // Minimal UPI sanity check (very permissive, won’t block valid IDs)
  function looksLikeUpi(s: string) {
    const v = s.trim();
    // allow simple patterns like user@bank, user.name@bank123
    return /^[a-z0-9._-]+@[a-z0-9._-]+$/i.test(v);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;

    const nameT = name.trim();
    const upiT = upi.trim();

    if (!nameT) {
      setErr("Please enter a partner name.");
      return;
    }
    if (!upiT || !looksLikeUpi(upiT)) {
      setErr("Please enter a valid UPI ID (e.g., name@bank).");
      return;
    }

    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/partners/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameT,
          upi_id: upiT,
          scopes, // string[]
        }),
      });

      if (!res.ok) {
        // Try to surface server error message if any
        let msg = "Failed to create partner.";
        try {
          const j = (await res.json()) as { error?: string };
          if (j?.error) msg = j.error;
        } catch {
          /* ignore JSON parse */
        }
        setErr(msg);
        setBusy(false);
        return;
      }

      // Optional: read Location header if the API returns it
      const next = res.headers.get("Location") || "/admin/partners";
      router.replace(next);
    } catch {
      setErr("Network error. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="container max-w-xl py-8">
      <h1 className="text-2xl font-bold mb-4">New Partner</h1>

      {err && (
        <div className="mb-3 rounded bg-red-50 text-red-700 px-3 py-2 text-sm">
          {err}
        </div>
      )}

      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="block text-sm font-medium" htmlFor="partner-name">
            Name
          </label>
          <input
            id="partner-name"
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="organization"
            required
            disabled={busy}
          />
        </div>

        <div>
          <label className="block text-sm font-medium" htmlFor="partner-upi">
            UPI ID
          </label>
          <input
            id="partner-upi"
            className="mt-1 w-full rounded-xl border px-3 py-2"
            placeholder="name@bank"
            value={upi}
            onChange={(e) => setUpi(e.target.value)}
            required
            disabled={busy}
          />
          <p className="mt-1 text-xs text-neutral-500">
            Example: <code>name@bank</code>
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium" htmlFor="partner-scopes">
            Scopes (comma separated)
          </label>
          <input
            id="partner-scopes"
            className="mt-1 w-full rounded-xl border px-3 py-2"
            placeholder="state:IN-UP, category:human"
            value={scopesText}
            onChange={(e) => setScopesText(e.target.value)}
            disabled={busy}
          />
          {scopes.length > 0 && (
            <p className="mt-1 text-xs text-neutral-500">
              Parsed: {scopes.join(", ")}
            </p>
          )}
        </div>

        <button type="submit" disabled={busy} className="btn">
          {busy ? "Saving…" : "Save partner"}
        </button>
      </form>
    </div>
  );
}
