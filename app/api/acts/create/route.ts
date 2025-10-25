import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";

type ProofIn = { kind: "photo"|"video"|"news_link"|"witness"|"follow_up"; url?: string; note?: string };
type Body = {
  storyId: string;
  level?: number;          // 1..5 (1 = top honor)
  note?: string;
  proofs?: ProofIn[];
};

export async function POST(req: Request) {
  try {
    const body = await req.json() as Body;
    if (!body.storyId) return NextResponse.json({ error: "Missing storyId" }, { status: 400 });

    const sb = supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Ensure story exists
    const { data: story } = await supabaseService
      .from("stories").select("id").eq("id", body.storyId).maybeSingle();
    if (!story) return NextResponse.json({ error: "Story not found" }, { status: 404 });

    const level = Math.min(5, Math.max(1, body.level ?? 5));

    // Create act
    const { data: act, error: actErr } = await supabaseService
      .from("good_acts")
      .insert({
        story_id: body.storyId,
        applicant_user: user.id,
        level,
        status: "under_review",
        note: body.note ?? null,
      })
      .select("id")
      .single();
    if (actErr) return NextResponse.json({ error: actErr.message }, { status: 400 });

    // Insert proofs
    const proofs = (body.proofs || [])
      .filter(p => p && p.kind && (p.url || p.note))
      .map(p => ({
        act_id: act.id,
        kind: p.kind,
        url: p.url || null,
        note: p.note || null,
      }));

    if (proofs.length) {
      const { error: prErr } = await supabaseService.from("good_proofs").insert(proofs);
      if (prErr) return NextResponse.json({ error: prErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, id: act.id });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
