"use client";

import { useState } from "react";

export default function SaveButton({
  storyId,
  initialSaved,
}: {
  storyId: string;
  initialSaved: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);

    const next = !saved;
    setSaved(next);

    try {
      const res = await fetch("/api/saves/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story_id: storyId, save: next }),
      });
      if (res.status === 401) {
        setSaved(!next);
        window.location.href = "/signin";
        return;
      }
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
    } catch (e) {
      setSaved(!next);
      alert((e as any).message || "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm border ${
        saved ? "bg-amber-500 text-white border-amber-500" : "bg-white"
      }`}
      aria-pressed={saved}
      aria-label="Save this story"
      title={saved ? "Unsave" : "Save"}
    >
      <span>★</span>
      <span>{saved ? "Saved" : "Save"}</span>
    </button>
  );
}
