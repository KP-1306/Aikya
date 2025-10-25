"use client";

import { useEffect, useState } from "react";

type Goal = { id: string; title: string; status: string; target_count: number; progress_count: number };

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [title, setTitle] = useState("");
  const [err, setErr] = useState<string|null>(null);

  async function load() {
    const r = await fetch("/api/coach/goals/list");
    const j = await r.json();
    if (!r.ok) setErr(j.error || "Failed");
    else setGoals(j.items || []);
  }
  useEffect(() => { load(); }, []);

  async function add() {
    setErr(null);
    const r = await fetch("/api/coach/goals/create", {
      method: "POST", headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ title })
    });
    const j = await r.json();
    if (!r.ok) setErr(j.error || "Failed");
    setTitle("");
    load();
  }

  async function tick(id: string) {
    const r = await fetch("/api/coach/goals/progress", {
      method: "POST", headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ id })
    });
    if (r.ok) load();
  }

  return (
    <div className="container max-w-xl py-8 space-y-5">
      <h1 className="text-2xl font-bold">My goals</h1>
      {err && <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-sm">{err}</div>}
      <div className="flex gap-2">
        <input className="flex-1 rounded-xl border px-3 py-2" placeholder="e.g. Share 3 compliments"
               value={title} onChange={e=>setTitle(e.target.value)} />
        <button className="btn-primary" onClick={add} disabled={!title.trim()}>Add</button>
      </div>
      <ul className="space-y-2">
        {goals.map(g => (
          <li key={g.id} className="rounded-xl border bg-white/70 p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{g.title}</div>
              <div className="text-xs text-neutral-600">{g.progress_count} / {g.target_count}</div>
            </div>
            <button className="btn" onClick={()=>tick(g.id)}>+1</button>
          </li>
        ))}
        {goals.length === 0 && <li className="text-neutral-500">No goals yet.</li>}
      </ul>
    </div>
  );
}
