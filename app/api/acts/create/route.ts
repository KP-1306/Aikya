// app/api/acts/create/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSupabaseService } from "@/lib/supabase/service";

type ProofIn = {
  kind: "photo" | "video" | "news_link" | "witness" | "follow_up";
  url?: string;
  note?: string;
};
type Body = {
  storyId: string;
  level?: number; // 1..5 (1 = top honor)
  note?: string;
  proofs?: ProofIn[];
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Body | null;
    if (!body?.storyId) {
      return NextResponse.json({ error: "Missing storyId" }, { status: 400 });
    }

    // Auth (cast once)
    const sb = supabaseServer();
    const sba = sb as any;
    const { data: userRes } = await sba.auth.getUser();
    const user = userRes?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Service client (bypasses RLS); cast once
    const svc = requireSupabaseService();
    const svca = svc as any;

    // Ensure story exists
    const { data: story } = await svca
      .from("stories")
      .select("id")
      .eq("id", body.storyId)
      .maybeSingle();
    if (!story) return NextResponse.json({ error: "Story not found" }, { status: 404 });

    const level = Math.min(5, Math.max(1, body.level ?? 5));

    // Create act
    const { data: act, error: actErr } = await svca
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

    // Insert proofs (optional)
    const proofs =
      (body.proofs || [])
        .filter((p) => p && p.kind && (p.url || p.note))
        .map((p) => ({
          act_id: act.id,
          kind: p.kind,
          url: p.url || null,
          note: p.note || null,
        })) ?? [];

    if (proofs.length) {
      const { error: prErr } = await svca.from("good_proofs").insert(proofs);
      if (prErr) return NextResponse.json({ error: prErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, id: act.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
