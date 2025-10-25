"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const KINDS = ["mentoring","tutoring","ride","groceries","job_referral","resume_review","other"] as const;

export default function NewSupportRequestPage() {
  const r = useRouter();
  const [kind, setKind] = useState<typeof KINDS[number]>("mentoring");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [visibility, setVisibility] = useState<"public"|"private">("public");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string|null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setBusy(true);
    const res = await fetch("/api/support/requests/create", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ kind, title, details, state, city, visibility })
    });
    setBusy(false);
    if (!res.ok) { const j = await res.json().catch(()=>({})); setErr(j.error||"Failed"); return; }
    const { id } = await res.json();
    r.push(`/support/${id}`);
  }

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-2xl font-bold mb-4">Ask for support</h1>
      {err && <div className="mb-3 rounded bg-red-50 text-red-700 px-3 py-2 text-sm">{err}</div>}
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="block text-sm font-medium">Type of help</label>
          <select className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={kind} onChange={e=>setKind(e.target.value as any)}>
            {KINDS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Short title</label>
          <input className="mt-1 w-full rounded-xl border px-3 py-2" required
                 value={title} onChange={e=>setTitle(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">Details</label>
          <textarea className="mt-1 w-full rounded-xl border px-3 py-2" rows={5}
                    value={details} onChange={e=>setDetails(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">State</label>
            <input className="mt-1 w-full rounded-xl border px-3 py-2"
                   value={state} onChange={e=>setState(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">City</label>
            <input className="mt-1 w-full rounded-xl border px-3 py-2"
                   value={city} onChange={e=>setCity(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Visibility</label>
          <select className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={visibility} onChange={e=>setVisibility(e.target.value as any)}>
            <option value="public">Public (details visible)</option>
            <option value="private">Private (details only visible after match)</option>
          </select>
        </div>
        <button className="btn-primary" disabled={busy}>{busy ? "Posting…" : "Post request"}</button>
      </form>
    </div>
  );
}
