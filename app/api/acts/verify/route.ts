import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSupabaseService } from "@/lib/supabase/service";


type Body = {
  actId: string;
  verdict: "confirm" | "deny" | "inconclusive";
  notes?: string;
  partnerId?: string | null;
};

export async function POST(req: Request) {
  try {
    const body = await req.json() as Body;
    if (!body.actId || !body.verdict) {
      return NextResponse.json({ error: "Missing actId/verdict" }, { status: 400 });
    }

    const supabaseService = requireSupabaseService();

    
    // Admin guard
    const sb = supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: admin } = await sb.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Insert verification row
    const { error: vErr } = await supabaseService.from("good_verifications").insert({
      act_id: body.actId,
      partner_id: body.partnerId ?? null,
      verifier_user: user.id,
      verdict: body.verdict,
      notes: body.notes ?? null
    });
    if (vErr) return NextResponse.json({ error: vErr.message }, { status: 400 });

    // Update act.status based on verdict
    const newStatus = body.verdict === "confirm" ? "verified"
                    : body.verdict === "deny" ? "rejected"
                    : "under_review";

    const { error: uErr } = await supabaseService
      .from("good_acts")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", body.actId);

    if (uErr) return NextResponse.json({ error: uErr.message }, { status: 400 });

    return NextResponse.json({ ok: true, status: newStatus });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
