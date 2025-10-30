// app/api/coach/checkin/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSupabaseService } from "@/lib/supabase/service";

export const dynamic = "force-dynamic"; // never pre-render
export const runtime = "nodejs";        // ensure Node on Netlify

type Suggestion = { id: string; text: string };
type OkResp = {
  ok: true;
  date: string;           // YYYY-MM-DD
  streak: number;         // consecutive days
  suggestions: Suggestion[];
};
type ErrResp = { error: string };

function todayISO() {
  const t = new Date();
  return t.toISOString().slice(0, 10);
}

function suggestionsFor(
  state?: string | null,
  interests: string[] = []
): Suggestion[] {
  // deterministic but simple suggestions; tweak anytime
  const base: Suggestion[] = [
    { id: "smile",         text: "Give 3 genuine compliments today." },
    { id: "call_parent",   text: "Call a parent/elder and ask about their day." },
    { id: "pickup_litter", text: "Pick up 5 pieces of litter in your area." },
    { id: "mentor_tip",    text: "Share one career tip on Aikya Support." },
    { id: "thankyou",      text: "Send a thank-you note to someone who helped you." },
  ];

  // Optional tweak by interest
  if (interests.includes("environment")) {
    base.unshift({ id: "plant", text: "Water a plant or plant a seed today." });
  }
  if (state) {
    base.push({ id: "local", text: `Post one positive news from ${state}.` });
  }
  return base.slice(0, 3);
}

export async function POST(req: Request) {
  try {
    // Auth (anon server client)
    const sb = supabaseServer();
    const { data: auth } = await sb.auth.getUser();
    const user = auth?.user ?? null;
    if (!user) {
      return NextResponse.json<ErrResp>({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseService = requireSupabaseService(); // throws if service key missing

    const today = todayISO();

    // Load existing karma profile (may be null on first check-in)
    const { data: prof0, error: profErr } = await supabaseService
      .from("karma_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profErr) {
      return NextResponse.json<ErrResp>({ error: profErr.message }, { status: 400 });
    }

    // Compute next streak (yesterday = today - 1d)
    const prevDate = prof0?.last_checkin_date ? String(prof0.last_checkin_date) : null;
    const yesterdayISO = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const nextStreak = prevDate === yesterdayISO ? (prof0?.streak_days ?? 0) + 1 : 1;

    // Build suggestions (guard interests to array of strings)
    const interests = Array.isArray(prof0?.interests)
      ? (prof0!.interests as string[])
      : [];
    const sugg = suggestionsFor((prof0 as any)?.state ?? null, interests);

    // Ensure a check-in row exists for (user_id, date)
    const { data: chk, error: insErr } = await supabaseService
      .from("karma_checkins")
      .upsert(
        { user_id: user.id, date: today, suggestions: sugg },
        { onConflict: "user_id,date" }
      )
      .select("id")
      .single();

    if (insErr) {
      return NextResponse.json<ErrResp>({ error: insErr.message }, { status: 400 });
    }

    // Upsert the profile with updated streak + last_checkin_date
    const { error: upErr } = await supabaseService
      .from("karma_profiles")
      .upsert(
        { user_id: user.id, last_checkin_date: today, streak_days: nextStreak },
        { onConflict: "user_id" }
      );

    if (upErr) {
      return NextResponse.json<ErrResp>({ error: upErr.message }, { status: 400 });
    }

    // Success
    return NextResponse.json<OkResp>(
      { ok: true, date: today, streak: nextStreak, suggestions: sugg },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    // If requireSupabaseService threw due to missing service key, it lands here
    return NextResponse.json<ErrResp>(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
