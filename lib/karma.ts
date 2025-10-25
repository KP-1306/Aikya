import { supabaseService } from "@/lib/supabase/service";

const REASONS: Record<string, number> = {
  page_streak: 5,
  like: 2,
  save: 3,
  comment_approved: 5,
  support_completed: 25,
  proof_cert: 40,
};

export async function awardKarma(userId: string, reason: keyof typeof REASONS, meta: any = {}) {
  const points = REASONS[reason] ?? 1;

  // 1) ledger
  const { error: ledErr } = await supabaseService.from("karma_ledger").insert({
    user_id: userId, points, reason, meta
  });
  if (ledErr) throw new Error(ledErr.message);

  // 2) bump profile totals
  const { data: prof } = await supabaseService
    .from("karma_profiles")
    .select("user_id,total_points")
    .eq("user_id", userId)
    .maybeSingle();

  const total = (prof?.total_points ?? 0) + points;

  // calc level via table
  const { data: levels } = await supabaseService
    .from("karma_levels")
    .select("level,min_points")
    .order("min_points", { ascending: true });

  let newLevel = 1;
  (levels ?? []).forEach(l => { if (total >= l.min_points) newLevel = l.level; });

  const { error: upErr } = await supabaseService
    .from("karma_profiles")
    .upsert({ user_id: userId, total_points: total, level: newLevel }, { onConflict: "user_id" });

  if (upErr) throw new Error(upErr.message);

  return { points, total, level: newLevel };
}
