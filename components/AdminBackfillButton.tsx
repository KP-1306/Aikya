// components/AdminBackfillButton.tsx
"use client";

import { useState } from "react";

export default function AdminBackfillButton() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/admin/embeddings/backfill?limit=50", {
        method: "POST",
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Failed");
      setMsg(`Updated ${j.updated} stories.`);
    } catch (e:any) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button className="btn" onClick={run} disabled={busy}>
        {busy ? "Embedding…" : "Backfill embeddings"}
      </button>
      {msg && <span className="text-sm text-neutral-600">{msg}</span>}
    </div>
  );
}
