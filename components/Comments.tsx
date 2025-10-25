"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import CommentForm from "./CommentForm";
import ModerateButtons from "./ModerateButtons";

type CommentRow = {
  id: number; // BIGINT in DB → number in JS
  story_id: string;
  user_id: string;
  body: string;
  created_at: string;
  status: "pending" | "approved" | "hidden" | "flagged";
  flags_count: number | null;
};

export default function Comments({ storyId }: { storyId: string }) {
  const [meId, setMeId] = useState<string | null>(null);
  const [canModerate, setCanModerate] = useState(false);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reported, setReported] = useState<Record<number, true>>({});
  const [error, setError] = useState<string | null>(null);

  // Load current user + moderator flag
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      if (!active) return;
      setMeId(uid);

      if (!uid) {
        setCanModerate(false);
        return;
      }

      // Check admin membership (policy must allow checking one's own membership)
      const { data: admin } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", uid)
        .maybeSingle();

      if (!active) return;
      setCanModerate(!!admin);
    })();

    return () => {
      active = false;
    };
  }, []);

  // Load comments
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);

      // Public: show only approved; Moderators: see everything
      const q = supabase
        .from("comments")
        .select("id, story_id, user_id, body, created_at, status, flags_count")
        .eq("story_id", storyId)
        .order("created_at", { ascending: true });

      const { data, error } = canModerate ? await q : await q.eq("status", "approved");

      if (!active) return;

      if (error) {
        setError(error.message);
        setComments([]);
      } else {
        setComments((data ?? []) as CommentRow[]);
      }
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [storyId, canModerate]);

  // Report (flag) a comment — optimistic UI
  async function report(commentId: number, ownerId: string) {
    if (!meId) {
      alert("Please sign in to report.");
      return;
    }
    if (meId === ownerId) {
      alert("You cannot report your own comment.");
      return;
    }
    if (reported[commentId]) return; // already flagged

    // optimistic: disable button + bump local flags_count
    setReported((r) => ({ ...r, [commentId]: true }));
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, flags_count: (c.flags_count || 0) + 1 } : c
      )
    );

    try {
      const res = await fetch("/api/comments/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to report.");

      // reconcile with server count if returned
      if (typeof j.flags === "number") {
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, flags_count: j.flags } : c))
        );
      }
    } catch (e: any) {
      // rollback optimistic change
      setReported((r) => {
        const { [commentId]: _, ...rest } = r;
        return rest;
      });
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, flags_count: Math.max(0, (c.flags_count || 1) - 1) }
            : c
        )
      );
      alert(e?.message || "Could not report this comment.");
    }
  }

  const infoText = useMemo(() => {
    if (loading) return "Loading comments…";
    if (error) return error;
    if (comments.length === 0) return "Be the first to comment.";
    return "";
  }, [loading, error, comments.length]);

  return (
    <section className="mt-10">
      <h3 className="text-lg font-semibold mb-3">Comments</h3>

      {/* Keep your existing form component */}
      <CommentForm storyId={storyId} />

      {/* List */}
      <ul className="mt-6 space-y-4">
        {infoText && <li className="text-sm text-neutral-500">{infoText}</li>}

        {comments.map((c) => (
          <li key={c.id} className="rounded-xl border p-4 bg-white/60">
            <div className="text-sm text-neutral-600 flex items-center justify-between gap-3">
              <div>
                <span className="font-medium">Reader</span>{" · "}
                <time dateTime={c.created_at}>
                  {new Date(c.created_at).toLocaleString()}
                </time>
                {c.status !== "approved" && (
                  <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                    {c.status === "pending" ? "Pending" : c.status}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-500">
                  {(c.flags_count || 0) > 0 ? `${c.flags_count} reports` : ""}
                </span>

                {/* Report button (hidden if my comment; disabled once clicked) */}
                <button
                  className="text-xs rounded-full border px-3 py-1 hover:bg-neutral-50 disabled:opacity-60"
                  onClick={() => report(c.id, c.user_id)}
                  disabled={!meId || meId === c.user_id || !!reported[c.id]}
                  title={
                    !meId
                      ? "Sign in to report"
                      : meId === c.user_id
                      ? "You can't report your own comment"
                      : reported[c.id]
                      ? "Already reported"
                      : "Report this comment"
                  }
                >
                  {reported[c.id] ? "Reported" : "Report"}
                </button>
              </div>
            </div>

            <p className="mt-2 whitespace-pre-wrap">{c.body}</p>

            {/* Moderator quick actions (approve/hide) if needed */}
            {canModerate && (
              <div className="mt-3">
                <ModerateButtons id={c.id} isApproved={c.status === "approved"} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
