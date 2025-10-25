"use client";

import { useEffect, useState } from "react";

type Resp = { ok: true; date: string; streak: number; suggestions: {id:string;text:string}[] } | { error: string };

export default function CheckinPage() {
  const [data, setData] = useState<Resp | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/coach/checkin", { method: "POST" })
      .then(r => r.json())
      .then((j: Resp) => {
        if ("error" in j) setErr(j.error);
        else setData(j);
      })
      .catch(() => setErr("Failed"));
  }, []);

  return (
    <div className="container max-w-xl py-8">
      <h1 className="text-2xl font-bold mb-2">Daily check-in</h1>
      {err && <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-sm">{err}</div>}
      {!data ? (
        <div className="text-neutral-500">Loading…</div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border bg-white/70 p-4">
            <div className="text-sm text-neutral-500">Date: {data.date}</div>
            <div className="text-sm text-neutral-600">Streak: {data.streak} days 🔥</div>
          </div>
          <div className="rounded-xl border bg-white/70 p-4">
            <h2 className="text-lg font-semibold mb-2">Suggestions</h2>
            <ul className="list-disc pl-5 space-y-1">
              {data.suggestions.map(s => <li key={s.id}>{s.text}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
