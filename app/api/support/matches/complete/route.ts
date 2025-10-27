import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSupabaseService } from "@/lib/supabase/service";


export async function POST(req: Request) {
  try {
    const { matchId } = await req.json();
    const sb = supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabaseService = requireSupabaseService();

    const { data: m } = await supabaseService.from("support_matches")
      .select("id, requester_id, supporter_id, request_id").eq("id", matchId).maybeSingle();
    if (!m) return NextResponse.json({ error: "Match not found" }, { status: 404 });

    // Either participant can mark complete (you may choose both-party confirmation later)
    if (user.id !== m.requester_id && user.id !== m.supporter_id)
      return NextResponse.json({ error: "Not a participant" }, { status: 403 });

    const { error } = await supabaseService.from("support_matches")
      .update({ status: "completed" }).eq("id", matchId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Optional: write a good_acts row + award karma, trigger certificate later
    await supabaseService.from("good_acts").insert({
      request_id: m.request_id,
      supporter_id: m.supporter_id,
      requester_id: m.requester_id,
      kind: "support",           // your enum/classification
      person_name: null
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
