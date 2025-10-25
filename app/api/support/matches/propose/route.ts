import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";

export async function POST(req: Request) {
  try {
    const { requestId, offerId } = await req.json();
    const sb = supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // fetch offer to get supporter_id, and request to get requester_id
    const { data: offer } = await supabaseService.from("support_offers")
      .select("id,user_id").eq("id", offerId).maybeSingle();
    const { data: reqRow } = await supabaseService.from("support_requests")
      .select("id,user_id").eq("id", requestId).maybeSingle();

    if (!offer || !reqRow) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (offer.user_id !== user.id)
      return NextResponse.json({ error: "Only the supporter (offer owner) can propose" }, { status: 403 });

    const { data: match, error } = await supabaseService.from("support_matches")
      .insert({
        request_id: requestId,
        offer_id: offerId,
        requester_id: reqRow.user_id,
        supporter_id: offer.user_id,
        status: "pending"
      }).select("id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, id: match.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
