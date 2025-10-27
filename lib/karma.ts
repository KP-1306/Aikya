// lib/karma.ts
import { requireSupabaseService } from "@/lib/supabase/service";

export type KarmaAction =
  | "comment"
  | "save"
  | "like"
  | "checkin"
  | "page_streak"; // <-- added

function pointsFor(action: KarmaAction): number {
  switch (action) {
    case "comment":
      return 2;
    // small rewards for lightweight actions
    case "save":
    case "like":
    case "checkin":
    case "page_streak":
      return 1;
  }
}

/**
 * Best-effort: bump user karma and (optionally) log a ledger row.
 * Never throws — errors are swallowed so your primary request never fails.
 *
 * Tables / RPC (optional but recommended):
 *   - karma_ledger(user_id uuid, action text, points int, meta jsonb, created_at timestamptz)
 *   - RPC: karma_bump(p_user_id uuid, p_points int)
 */
export async function awardKarma(
  userId: string | number,                 // accepts UUID string (or numeric id)
  action: KarmaAction,
  meta?: Record<string, unknown>
): Promise<void> {
  const uid = String(userId);
  const points = pointsFor(action);

  const supabase = requireSupabaseService();

  // Optional ledger row
  try {
    await supabase.from("karma_ledger").insert({
      user_id: uid,
      action,
      points,
      meta: meta ?? null,
    });
  } catch {
    // ignore — ledger is optional
  }

  // Optional aggregate bump via RPC
  try {
    await supabase.rpc("karma_bump", {
      p_user_id: uid,
      p_points: points,
    });
  } catch {
    // ignore — best-effort bookkeeping
  }
}
