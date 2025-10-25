"use client";
import { useState } from "react";

type Proof = { kind: "photo"|"video"|"news_link"|"witness"|"follow_up"; url?: string; note?: string };

export default function ProofPanel({ storyId }: { storyId: string }) {
  const [level, setLevel] = useState(5);
  const [note, setNote] = useState("");
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function addProof() {
    setProofs(p => [...p, { kind: "news_link" }]);
  }

  function updateProof(i: number, patch: Partial<Proof>) {
    setProofs(p => p.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  }

  async function submit() {
    setLoading(true); setErr(null); setMsg(null);
    try {
      const res = await fetch("/api/acts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId, level, note, proofs })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      setMsg("Submitted! We’ll review it shortly.");
      setProofs([]); setNote(""); setLevel(5);
    } catch (e:any) {
      setErr(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border p-4 bg-white/60">
      <h3 className="font-semibold">Submit Proof-of-Good</h3>
      <p className="text-sm text-neutral-600">
        Did you (or your group) do something aligned to this story? Share a short note and supporting links.
      </p>

      <div className="mt-3 grid gap-3">
        <label className="text-sm">
          Level (1 = highest honor)
          <input type="number" min={1} max={5} value={level}
            onChange={(e)=>setLevel(Number(e.target.value))}
            className="mt-1 w-24 rounded-xl border px-3 py-2 ml-2" />
        </label>

        <label className="text-sm block">
          Note
          <textarea value={note} onChange={(e)=>setNote(e.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2" rows={3} />
        </label>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Proofs</span>
            <button onClick={addProof} className="btn btn-sm">Add</button>
          </div>
          {proofs.length === 0 && <div className="text-sm text-neutral-500">No proofs added.</div>}
          {proofs.map((p, i) => (
            <div key={i} className="rounded-lg border p-3 grid gap-2">
              <select
                className="rounded-xl border px-2 py-1 w-40"
                value={p.kind}
                onChange={(e)=>updateProof(i, { kind: e.target.value as Proof["kind"] })}
              >
                <option value="photo">Photo</option>
                <option value="video">Video</option>
                <option value="news_link">News Link</option>
                <option value="witness">Witness Note</option>
                <option value="follow_up">Follow-up</option>
              </select>
              <input
                placeholder="URL (if any)"
                className="rounded-xl border px-3 py-2"
                value={p.url || ""}
                onChange={(e)=>updateProof(i, { url: e.target.value })}
              />
              <input
                placeholder="Note (optional)"
                className="rounded-xl border px-3 py-2"
                value={p.note || ""}
                onChange={(e)=>updateProof(i, { note: e.target.value })}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={submit} disabled={loading} className="btn">
            {loading ? "Submitting…" : "Submit for review"}
          </button>
          {msg && <div className="text-green-700 text-sm">{msg}</div>}
          {err && <div className="text-red-600 text-sm">{err}</div>}
        </div>

        <p className="text-xs text-neutral-500">
          We verify before issuing a certificate. Level ≤ 2 may be featured as an animated story on YouTube.
        </p>
      </div>
    </div>
  );
}
