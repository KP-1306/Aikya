import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSupabaseService } from "@/lib/supabase/service";


export async function POST(req: Request) {
  try {
    const { matchId, decision } = await req.json(); // 'accept' | 'decline'
    const sb = supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabaseService = requireSupabaseService();

    const { data: m } = await supabaseService.from("support_matches")
      .select("id, requester_id").eq("id", matchId).maybeSingle();
    if (!m) return NextResponse.json({ error: "Match not found" }, { status: 404 });
    if (m.requester_id !== user.id) return NextResponse.json({ error: "Only requester can respond" }, { status: 403 });

    const newStatus = decision === "accept" ? "accepted" : "declined";
    const { error } = await supabaseService.from("support_matches")
      .update({ status: newStatus }).eq("id", matchId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true, status: newStatus });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
