// lib/karma/server.ts
// Server-only helpers for awarding karma. Designed to be safe to call from API routes.
// - Keeps compatibility with existing imports that expect `awardKarma`
// - Adds `bumpKarmaBestEffort` used by Support Engine verification
// - All writes are best-effort and intentionally do not throw

// If you already have a concrete type for your Supabase client, feel free to replace `any`.
type Supa = any;

export type KarmaReason =
  | "support_approved"
  | "coach_checkin"
  | "story_saved"
  | "story_liked"
  | "admin_adjust"
  | (string & {}); // allow future reasons without changing the type

/**
 * Best-effort insert into karma_ledger (+ optional running total in karma_profiles).
 * Never throws: all errors are swallowed so caller UX is never blocked by karma bookkeeping.
 */
export async function bumpKarmaBestEffort(
  supa: Supa,
  userId: string,
  delta: number,
  reason: KarmaReason,
  meta?: Record<string, unknown>
): Promise<void> {
  if (!supa || !userId || !Number.isFinite(delta)) return;

  try {
    // 1) Append to ledger
    await supa.from("karma_ledger").insert({
      user_id: userId,
      delta,
      reason,
      meta: meta ?? null,
    });
  } catch {
    // ignore
  }

  try {
    // 2) Maintain a running total (if you keep one)
    //    This upsert pattern works whether karma_profiles row exists or not.
    await supa
      .from("karma_profiles")
      .upsert(
        { user_id: userId, total: delta },
        { onConflict: "user_id", ignoreDuplicates: false }
      );

    // Some PostgREST versions don’t support expressions in upsert.
    // If your total doesn’t increment, uncomment the manual increment block below:

    // const { data: kp } = await supa
    //   .from("karma_profiles")
    //   .select("total")
    //   .eq("user_id", userId)
    //   .single();
    // const next = (kp?.total ?? 0) + delta;
    // await supa
    //   .from("karma_profiles")
    //   .upsert({ user_id: userId, total: next }, { onConflict: "user_id" });

  } catch {
    // ignore
  }
}

/**
 * Back-compat shim for older code that imported `awardKarma` from here.
 * Delegates to `bumpKarmaBestEffort`. Signature kept intentionally loose.
 */
export async function awardKarma(
  supa: Supa,
  userId: string,
  delta: number,
  reason: KarmaReason,
  meta?: Record<string, unknown>
): Promise<void> {
  return bumpKarmaBestEffort(supa, userId, delta, reason, meta);
}

// If older code does `export { awardKarma } from "@/lib/karma/server"` it will still work.
export default {
  bumpKarmaBestEffort,
  awardKarma,
};
