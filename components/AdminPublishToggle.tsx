  // components/AdminPublishToggle.tsx
"use client";

import { useState } from "react";

export default function AdminPublishToggle({ id, initial }: { id: string; initial: boolean }) {
  const [on, setOn] = useState(!!initial);
  const [busy, setBusy] = useState(false);
  const label = on ? "Unpublish" : "Publish";

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const next = !on;
    setOn(next); // optimistic
    try {
      const res = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, publish: next }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
    } catch (e: any) {
      setOn(!next); // revert on error
      alert(e?.message || "Could not update publish status.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`rounded-full px-3 py-1.5 text-sm border ${
        on ? "bg-emerald-600 text-white border-emerald-600" : "bg-white"
      }`}
      title={label}
      aria-pressed={on}
    >
      {busy ? "Saving…" : label}
    </button>
  );
}
