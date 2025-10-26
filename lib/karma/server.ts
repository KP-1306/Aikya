// lib/karma/server.ts
import { supabaseService } from "@/lib/supabase/service";

/**
 * Minimal, fail-safe karma helper used by API routes.
 * You can safely ship this as a stub now and evolve the logic later.
 */
export async function awardKarma(
  userId: string,
  action: "save" | "like" | "comment",
  meta?: Record<string, unknown>
) {
  try {
    // OPTIONAL: write a row to your karma ledger if you created that table
    // If the table doesn't exist yet, this will silently be ignored by the catch.
    await supabaseService
      .from("karma_ledger")
      .insert({
        user_id: userId,
        action,
        meta: meta ?? null,           // jsonb column recommended
        points: action === "comment" ? 2 : 1, // tweak as you like
      });

    // OPTIONAL: bump profile score if you have karma_profiles.score (int)
    // This is best done via a SQL function, but we do a best-effort update here.
    await supabaseService.rpc("karma_bump", {
      p_user_id: userId,
      p_points: action === "comment" ? 2 : 1,
    }).catch(() => { /* rpc optional */ });

  } catch {
    // Best-effort only. Never fail the API call on karma bookkeeping.
  }
}
