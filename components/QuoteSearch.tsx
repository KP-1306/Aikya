"use client";
import { useState } from "react";

export default function QuoteSearch({ defaultState }: { defaultState?: string }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);

  async function run() {
    setLoading(true); setErr(null);
    const res = await fetch("/api/search/quote", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quote: q, state: defaultState, limit: 10 })
    });
    const j = await res.json();
    setLoading(false);
    if (!res.ok) { setErr(j.error || "Failed"); return; }
    setResults(j.results || []);
  }

  return (
    <div className="space-y-3">
      <textarea
        placeholder="Paste a motivational quote…"
        value={q} onChange={(e)=>setQ(e.target.value)}
        className="w-full rounded-xl border px-3 py-2" rows={3}
      />
      <button onClick={run} disabled={loading || q.trim().length<4} className="btn">
        {loading ? "Searching…" : "Find related stories"}
      </button>
      {err && <div className="text-red-600 text-sm">{err}</div>}
      <ul className="divide-y rounded-xl border bg-white/70">
        {results.map(r=>(
          <li key={r.id} className="p-4">
            <a className="font-medium hover:underline" href={`/story/${r.slug}`}>{r.title}</a>
            <div className="text-sm text-neutral-600">
              {(r.city || r.state || "")} · {r.published_at ? new Date(r.published_at).toDateString() : ""}
            </div>
            {r.dek && <p className="mt-1 text-sm text-neutral-700">{r.dek}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
