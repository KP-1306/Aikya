"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewPartnerPage() {
  const r = useRouter();
  const [name, setName] = useState("");
  const [upi, setUpi] = useState("");
  const [scopes, setScopes] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    const res = await fetch("/api/admin/partners/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        upi_id: upi,
        scopes: scopes.split(",").map(s => s.trim()).filter(Boolean)
      })
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({} as any));
      setErr(j.error || "Failed");
      return;
    }
    r.push("/admin/partners");
  }

  return (
    <div className="container max-w-xl py-8">
      <h1 className="text-2xl font-bold mb-4">New Partner</h1>
      {err && <div className="mb-3 rounded bg-red-50 text-red-700 px-3 py-2 text-sm">{err}</div>}
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input className="mt-1 w-full rounded-xl border px-3 py-2"
                 value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium">UPI ID</label>
          <input className="mt-1 w-full rounded-xl border px-3 py-2"
                 value={upi} onChange={e => setUpi(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium">Scopes (comma separated)</label>
          <input className="mt-1 w-full rounded-xl border px-3 py-2"
                 placeholder="state:IN-UP, category:human"
                 value={scopes} onChange={e => setScopes(e.target.value)} />
        </div>
        <button disabled={busy} className="btn-primary">{busy ? "Saving…" : "Save partner"}</button>
      </form>
    </div>
  );
}
