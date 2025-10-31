// app/coach/goals/progress/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSupabaseService } from "@/lib/supabase/service";
import { awardKarma } from "@/lib/karma/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { id } = (await req.json()) as { id?: string };
  if (!id) return NextResponse.json({ error: "Missing goal id" }, { status: 400 });

  const sb = supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const svc = requireSupabaseService();

  // Load goal (must belong to the caller)
  const { data: g, error: getErr } = await svc
    .from("karma_goals")
    .select("id, user_id, progress_count, target_count, status")
    .eq("id", id)
    .single();

  if (getErr || !g || g.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Increment progress
  const next = (g.progress_count ?? 0) + 1;
  const done = next >= (g.target_count ?? 1);

  const { error: updErr } = await svc
    .from("karma_goals")
    .update({ progress_count: next, status: done ? "completed" : g.status })
    .eq("id", id);

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

  // Small reward for progress (best-effort)
  try {
    // awardKarma(supa, userId, delta, reason, meta?)
    await awardKarma(svc, user.id, 1, "coach_checkin", { goal_id: id, progress: next });
  } catch {
    // ignore karma errors
  }

  return NextResponse.json({
    ok: true,
    progress: next,
    status: done ? "completed" : g.status,
  });
}
