import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";

type Body = { actId: string; issueYT?: boolean };

export async function POST(req: Request) {
  try {
    const body = await req.json() as Body;
    if (!body.actId) return NextResponse.json({ error: "Missing actId" }, { status: 400 });

    // Admin guard
    const sb = supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: admin } = await sb.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Load act
    const { data: act, error: aErr } = await supabaseService
      .from("good_acts")
      .select("id, level, status")
      .eq("id", body.actId)
      .single();
    if (aErr || !act) return NextResponse.json({ error: "Act not found" }, { status: 404 });
    if (act.status !== "verified") {
      return NextResponse.json({ error: "Act must be verified first" }, { status: 400 });
    }

    // Generate a simple certificate URL placeholder (you can replace with a real generator later)
    const certificateUrl = `https://${
      process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || "example"
    }.supabase.co/storage/v1/object/public/certificates/${act.id}.txt`;

    // Save certificate URL on act
    const { error: uErr } = await supabaseService
      .from("good_acts")
      .update({ certificate_url: certificateUrl, updated_at: new Date().toISOString() })
      .eq("id", act.id);
    if (uErr) return NextResponse.json({ error: uErr.message }, { status: 400 });

    // Reward rows
    const rewards = [
      {
        act_id: act.id,
        level_issued: act.level,
        kind: "certificate",
        payload: { url: certificateUrl },
        fulfilled: true
      }
    ];

    // Only Level ≤ 2 eligible for YT animation
    if (body.issueYT && act.level <= 2) {
      rewards.push({
        act_id: act.id,
        level_issued: act.level,
        kind: "yt_animation",
        payload: { status: "queued" },
        fulfilled: false
      } as any);
    }

    const { error: rErr } = await supabaseService.from("rewards").insert(rewards);
    if (rErr) return NextResponse.json({ error: rErr.message }, { status: 400 });

    return NextResponse.json({ ok: true, certificateUrl });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
