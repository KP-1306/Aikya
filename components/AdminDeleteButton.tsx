"use client";

import { useState } from "react";

export default function AdminDeleteButton({ id, title }: { id: string; title?: string }) {
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (busy) return;
    const ok = confirm(
      `Delete this story${title ? `: “${title}”` : ""}?\n\n` +
      `This will remove comments, likes/saves and sources linked to it.`
    );
    if (!ok) return;

    setBusy(true);
    try {
      const res = await fetch("/api/admin/stories/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Delete failed");

      // Refresh the list after delete
      location.reload();
    } catch (e: any) {
      alert(e?.message || "Could not delete story.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={onDelete}
      disabled={busy}
      className="rounded-full border px-3 py-1.5 text-sm text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-60"
      title="Delete story"
    >
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
}
