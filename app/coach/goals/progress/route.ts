import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSupabaseService } from "@/lib/supabase/service";

import { awardKarma } from "@/lib/karma";

export async function POST(req: Request) {
  const { id } = await req.json() as { id?: string };
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
const supabaseService = requireSupabaseService();

  // increment progress
  const { data: g, error: getErr } = await supabaseService
    .from("karma_goals").select("id, user_id, progress_count, target_count, status")
    .eq("id", id).single();
  if (getErr || !g || g.user_id !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const next = (g.progress_count ?? 0) + 1;
  const done = next >= (g.target_count ?? 1);
  const { error: updErr } = await supabaseService.from("karma_goals")
    .update({ progress_count: next, status: done ? "completed" : g.status })
    .eq("id", id);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

  // small reward for progress
  await awardKarma(user.id, "page_streak", { goalId: id, progress: next });

  return NextResponse.json({ ok: true, progress: next, status: done ? "completed" : g.status });
}
