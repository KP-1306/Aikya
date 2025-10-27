// lib/karma/server.ts
import { requireSupabaseService } from "@/lib/supabase/service";

/**
 * Best-effort: bump user karma and (optionally) log a ledger row.
 * Never throws — errors are swallowed so your primary request never fails.
 *
 * If you created a `karma_ledger` table, we'll try to insert there.
 * Also expects a Postgres function: karma_bump(p_user_id uuid, p_points int)
 */
export async function awardKarma(
  userId: string,
  action: "comment" | "save" | "like" | "checkin",
  meta?: Record<string, unknown>
) {
  const points = action === "comment" ? 2 : 1;

  const supabaseService = requireSupabaseService();

  // Try to write a ledger row (optional table).
  try {
    await supabaseService.from("karma_ledger").insert({
      user_id: userId,
      action,
      points,
      meta: meta ?? null, // jsonb column recommended
    });
  } catch {
    // ignore — ledger is optional
  }

  // Try to bump the user's aggregate karma score via RPC.
  try {
    await supabaseService.rpc("karma_bump", {
      p_user_id: userId,
      p_points: points,
    });
  } catch {
    // ignore — best-effort bookkeeping
  }
}
