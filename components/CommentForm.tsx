"use client";

import { useState } from "react";

export default function CommentForm({ storyId }: { storyId: string }) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setMsg(null);

    const clean = body.trim();
    if (clean.length < 3) { setErr("Please write a bit more."); return; }
    if (clean.length > 2000) { setErr("Max 2000 characters."); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story_id: storyId, body: clean }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");

      setBody("");
      setMsg("Thanks! Your comment will appear after review.");
    } catch (e: any) {
      setErr(e?.message || "Could not post comment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      {msg && <div className="rounded bg-green-50 text-green-700 px-3 py-2 text-sm">{msg}</div>}
      {err && <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-sm">{err}</div>}

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share a kind, constructive thought…"
        className="w-full rounded-xl border px-3 py-2"
        rows={3}
      />
      <div className="flex items-center gap-3">
        <button disabled={submitting} className="btn-primary">
          {submitting ? "Posting…" : "Post comment"}
        </button>
        <p className="text-xs text-neutral-500">Max 2000 chars. Be respectful.</p>
      </div>
    </form>
  );
}
