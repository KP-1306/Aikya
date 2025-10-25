"use client";

import { useState } from "react";
import Link from "next/link";

type Row = {
  id: string;
  story_id: string;
  user_id: string;
  body: string;
  created_at: string;
  status: "pending" | "approved" | "hidden" | "flagged";
  flags_count: number;
};

export default function ModerationTable({ rows, emptyText }: { rows: Row[]; emptyText: string }) {
  const [items, setItems] = useState(rows);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function action(id: string, op: "approve" | "hide" | "ban") {
    if (busyId) return;
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/moderation/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, op }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Action failed");
      // Remove or update row locally
      if (op === "approve" || op === "hide") {
        setItems(prev => prev.filter(r => r.id !== id));
      } else if (op === "ban") {
        // After ban, hide comment too
        setItems(prev => prev.filter(r => r.id !== id));
      }
    } catch (e: any) {
      alert(e?.message || "Could not perform action.");
    } finally {
      setBusyId(null);
    }
  }

  if (!items.length) {
    return <div className="rounded-xl border bg-white/70 p-4 text-sm text-neutral-500">{emptyText}</div>;
  }

  return (
    <div className="rounded-xl border bg-white/70 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50">
          <tr className="text-left">
            <th className="px-4 py-2">Comment</th>
            <th className="px-4 py-2">Story</th>
            <th className="px-4 py-2">User</th>
            <th className="px-4 py-2">Flags</th>
            <th className="px-4 py-2">When</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(r => (
            <tr key={r.id} className="border-t align-top">
              <td className="px-4 py-2 max-w-[40ch]">
                <div className="whitespace-pre-wrap">{r.body}</div>
              </td>
              <td className="px-4 py-2">
                <Link href={`/story/${r.story_id}`} className="underline">Open</Link>
              </td>
              <td className="px-4 py-2 text-xs">{r.user_id}</td>
              <td className="px-4 py-2">{r.flags_count ?? 0}</td>
              <td className="px-4 py-2">{new Date(r.created_at).toLocaleString()}</td>
              <td className="px-4 py-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => action(r.id, "approve")}
                    disabled={busyId === r.id}
                    className="rounded-full border px-3 py-1.5"
                    title="Approve (visible)"
                  >
                    {busyId === r.id ? "…" : "Approve"}
                  </button>
                  <button
                    onClick={() => action(r.id, "hide")}
                    disabled={busyId === r.id}
                    className="rounded-full border px-3 py-1.5"
                    title="Hide (not visible)"
                  >
                    Hide
                  </button>
                  <button
                    onClick={() => {
                      const ok = confirm("Ban this user and hide the comment?");
                      if (ok) action(r.id, "ban");
                    }}
                    disabled={busyId === r.id}
                    className="rounded-full border px-3 py-1.5 text-red-600 border-red-200 hover:bg-red-50"
                    title="Ban user (future comments blocked)"
                  >
                    Ban
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
