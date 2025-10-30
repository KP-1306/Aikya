// app/support/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SupportNew() {
  const r = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [evidence, setEvidence] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/support/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description, city, state, evidence_url: evidence,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed");
      r.push(`/support/${json.id}`);
    } catch (e: any) {
      setErr(e?.message || "Failed to create");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container max-w-2xl py-10 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Submit a Support Action</h1>
        <p className="text-sm text-neutral-600">
          Non-cash help you offered (time, effort, skills, coordination). Add a link/photo as evidence if available.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Title *</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            placeholder="Eg. Coordinated winter blanket drive in Dehradun"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            className="mt-1 w-full rounded border px-3 py-2"
            rows={4}
            placeholder="What did you do? Who benefited? Any partners?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">City</label>
            <input className="mt-1 w-full rounded border px-3 py-2" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">State</label>
            <input className="mt-1 w-full rounded border px-3 py-2" value={state} onChange={(e) => setState(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Evidence URL</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            placeholder="https://photos.app.goo.gl/... or https://drive.google.com/..."
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
          />
        </div>

        {err ? <p className="text-sm text-red-600">{err}</p> : null}

        <div className="flex gap-3">
          <button className="btn" disabled={busy}>{busy ? "Submitting…" : "Submit"}</button>
        </div>
      </form>
    </main>
  );
}
