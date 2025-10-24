"use client";

import { useState } from "react";

export default function ModerateButtons({ id, isApproved }: { id: number; isApproved: boolean }) {
  const [busy, setBusy] = useState(false);
  const [local, setLocal] = useState(isApproved);

  async function setApproval(approve: boolean) {
    setBusy(true);
    try {
      const res = await fetch("/api/comments/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, approve }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setLocal(approve);
    } catch (e) {
      alert((e as any).message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 flex items-center gap-2 text-xs">
      {!local ? (
        <button disabled={busy} onClick={() => setApproval(true)} className="rounded bg-emerald-600 text-white px-2 py-1">
          Approve
        </button>
      ) : (
        <button disabled={busy} onClick={() => setApproval(false)} className="rounded bg-neutral-200 px-2 py-1">
          Hide
        </button>
      )}
    </div>
  );
}
