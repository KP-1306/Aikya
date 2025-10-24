"use client";

import { useState } from "react";

export default function LikeButton({
  storyId,
  initialCount,
  initialLiked,
}: {
  storyId: string;
  initialCount: number;
  initialLiked: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);

    // optimistic
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));

    try {
      const res = await fetch("/api/likes/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story_id: storyId, like: next }),
      });
      const j = await res.json();
      if (res.status === 401) {
        // revert and send to signin
        setLiked(!next);
        setCount((c) => c + (next ? -1 : 1));
        window.location.href = "/signin";
        return;
      }
      if (!res.ok) throw new Error(j.error || "Failed");
      if (typeof j.likes === "number") setCount(j.likes); // sync exact count
    } catch (e) {
      // revert on error
      setLiked(!next);
      setCount((c) => c + (next ? -1 : 1));
      alert((e as any).message || "Could not update like.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm border ${
        liked ? "bg-rose-600 text-white border-rose-600" : "bg-white"
      }`}
      aria-pressed={liked}
      aria-label="Like this story"
      title={liked ? "Unlike" : "Like"}
    >
      <span>♥</span>
      <span>{count}</span>
    </button>
  );
}
