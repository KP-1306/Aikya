"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const KINDS = ["mentoring","tutoring","ride","groceries","job_referral","resume_review","other"] as const;

export default function NewSupportOfferPage() {
  const r = useRouter();
  const [kinds, setKinds] = useState<string[]>(["mentoring"]);
  const [headline, setHeadline] = useState("");
  const [details, setDetails] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [availability, setAvailability] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string|null>(null);

  function toggle(k: string) {
    setKinds(prev => prev.includes(k) ? prev.filter(x=>x!==k) : [...prev, k]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setBusy(true);
    const res = await fetch("/api/support/offers/create", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ kinds, headline, details, state, city, availability })
    });
    setBusy(false);
    if (!res.ok) { const j = await res.json().catch(()=>({})); setErr(j.error||"Failed"); return; }
    r.push(`/support`);
  }

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-2xl font-bold mb-4">Offer support</h1>
      {err && <div className="mb-3 rounded bg-red-50 text-red-700 px-3 py-2 text-sm">{err}</div>}
      <form className="space-y-4" onSubmit={submit}>
        <fieldset>
          <legend className="block text-sm font-medium">I can help with</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {KINDS.map(k =>
              <label key={k} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={kinds.includes(k)} onChange={()=>toggle(k)} />
                {k}
              </label>
            )}
          </div>
        </fieldset>
        <div>
          <label className="block text-sm font-medium">Headline</label>
          <input className="mt-1 w-full rounded-xl border px-3 py-2" required
                 value={headline} onChange={e=>setHeadline(e.target.value)} />
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
          <label className="block text-sm font-medium">Availability</label>
          <input className="mt-1 w-full rounded-xl border px-3 py-2"
                 value={availability} onChange={e=>setAvailability(e.target.value)} placeholder="Weekends, 6–8pm" />
        </div>
        <button className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Publish offer"}</button>
      </form>
    </div>
  );
}
