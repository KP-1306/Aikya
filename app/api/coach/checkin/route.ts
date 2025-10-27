import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSupabaseService } from "@/lib/supabase/service";


function todayISO() {
  const t = new Date();
  return t.toISOString().slice(0,10);
}

function suggestionsFor(state?: string|null, interests: string[] = []) {
  // deterministic but simple suggestions, adjust later
  const base = [
    { id: "smile", text: "Give 3 genuine compliments today." },
    { id: "call_parent", text: "Call a parent/elder and ask about their day." },
    { id: "pickup_litter", text: "Pick up 5 pieces of litter in your area." },
    { id: "mentor_tip", text: "Share one career tip on Aikya Support." },
    { id: "thankyou", text: "Send a thank-you note to someone who helped you." },
  ];
  // Optional tweak by interest
  if (interests.includes("environment")) base.unshift({ id: "plant", text: "Water a plant or plant a seed today." });
  if (state) base.push({ id: "local", text: `Post one positive news from ${state}.` });
  return base.slice(0,3);
}

export async function POST(req: Request) {
  try {
    const sb = supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const today = todayISO();

    const supabaseService = requireSupabaseService();

    // profile
    const { data: prof0 } = await supabaseService
      .from("karma_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const prevDate = prof0?.last_checkin_date ? String(prof0.last_checkin_date) : null;
    const yesterdayISO = new Date(Date.now() - 86400000).toISOString().slice(0,10);
    const nextStreak = prevDate === yesterdayISO ? (prof0?.streak_days ?? 0) + 1 : 1;

    // ensure a check-in row exists
    const sugg = suggestionsFor(prof0?.state ?? null, prof0?.interests ?? []);
    const { data: chk, error: insErr } = await supabaseService
      .from("karma_checkins")
      .upsert({ user_id: user.id, date: today, suggestions: sugg }, { onConflict: "user_id,date" })
      .select("id")
      .single();
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 });

    // update streak
    await supabaseService
      .from("karma_profiles")
      .upsert({
        user_id: user.id,
        last_checkin_date: today,
        streak_days: nextStreak
      }, { onConflict: "user_id" });

    return NextResponse.json({
      ok: true,
      date: today,
      streak: nextStreak,
      suggestions: sugg
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
