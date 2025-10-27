// lib/karma.ts
import { requireSupabaseService } from "@/lib/supabase/service";

export type KarmaAction = "comment" | "save" | "like" | "checkin";

/**
 * Best-effort: bump user karma and (optionally) log a ledger row.
 * Never throws — errors are swallowed so your primary request never fails.
 *
 * Tables / RPC (optional but recommended):
 *   - karma_ledger(user_id uuid, action text, points int, meta jsonb, created_at timestamptz)
 *   - RPC: karma_bump(p_user_id uuid, p_points int)
 */
export async function awardKarma(
  userId: string | number,             // <-- accept UUID string (or numeric id)
  action: KarmaAction,
  meta?: Record<string, unknown>
): Promise<void> {
  // Coerce to string because RPC expects uuid text
  const uid = String(userId);
  const points = action === "comment" ? 2 : 1;

  const supabase = requireSupabaseService();

  // Try to write a ledger row (optional)
  try {
    await supabase.from("karma_ledger").insert({
      user_id: uid,
      action,
      points,
      meta: meta ?? null, // jsonb column recommended
    });
  } catch {
    // ignore — ledger is optional
  }

  // Try to bump the user's aggregate karma score via RPC (optional)
  try {
    await supabase.rpc("karma_bump", {
      p_user_id: uid,
      p_points: points,
    });
  } catch {
    // ignore — best-effort bookkeeping
  }
}
