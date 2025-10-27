// lib/karma.ts
import { requireSupabaseService } from "@/lib/supabase/service";

export type KarmaMeta = Record<string, unknown>;

/**
 * Award karma to a user and log it to the ledger.
 * Safe to call from API routes. Creates the Supabase service client lazily.
 */
export async function awardKarma(
  userId: string,
  points: number,
  reason: string,
  meta?: KarmaMeta
): Promise<void> {
  const supabaseService = requireSupabaseService();

  // 1) ledger entry
  const { error: ledErr } = await supabaseService
    .from("karma_ledger")
    .insert({
      user_id: userId,
      points,
      reason,
      meta,
    });

  if (ledErr) throw new Error(ledErr.message);

  // 2) upsert/accumulate total in profiles
  //    (keeps a quick tally alongside the immutable ledger)
  const { data: existing, error: fetchErr } = await supabaseService
    .from("karma_profiles")
    .select("id, karma")
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchErr) throw new Error(fetchErr.message);

  if (!existing) {
    const { error: insertErr } = await supabaseService
      .from("karma_profiles")
      .insert({ user_id: userId, karma: points });

    if (insertErr) throw new Error(insertErr.message);
  } else {
    const newTotal = (existing.karma ?? 0) + points;

    const { error: updateErr } = await supabaseService
      .from("karma_profiles")
      .update({ karma: newTotal })
      .eq("id", existing.id);

    if (updateErr) throw new Error(updateErr.message);
  }
}
