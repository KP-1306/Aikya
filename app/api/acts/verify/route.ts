// app/api/acts/verify/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSupabaseService } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Body = {
  actId: string;
  verdict: "confirm" | "deny" | "inconclusive";
  notes?: string;
  partnerId?: string | null;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Body | null;
    if (!body?.actId || !body?.verdict) {
      return NextResponse.json({ error: "Missing actId/verdict" }, { status: 400 });
    }

    // Auth (cast once for TS build safety)
    const sb = supabaseServer();
    const sba = sb as any;
    const { data: userRes } = await sba.auth.getUser();
    const user = userRes?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Admin/Owner guard: RPC → user_profiles → profiles
    let isAdmin = false;
    try {
      const { data, error } = await sba.rpc("is_admin").single();
      if (!error && (data as unknown as boolean) === true) isAdmin = true;
    } catch {
      /* ignore rpc error and fall back */
    }

    if (!isAdmin) {
      let role: string | null = null;
      const up = await sba.from("user_profiles").select("role").eq("id", user.id).maybeSingle();
      if (!up.error) role = up.data?.role ?? null;

      if (!role) {
        const pf = await sba.from("profiles").select("role").eq("id", user.id).maybeSingle();
        if (!pf.error) role = pf.data?.role ?? null;
      }

      if (role !== "admin" && role !== "owner") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Service client (RLS bypass); cast once
    const svc = requireSupabaseService();
    const svca = svc as any;

    // Insert verification record
    const { error: vErr } = await svca.from("good_verifications").insert({
      act_id: body.actId,
      partner_id: body.partnerId ?? null,
      verifier_user: user.id,
      verdict: body.verdict,
      notes: body.notes ?? null,
    });
    if (vErr) return NextResponse.json({ error: vErr.message }, { status: 400 });

    // Update act status
    const newStatus =
      body.verdict === "confirm"
        ? "verified"
        : body.verdict === "deny"
        ? "rejected"
        : "under_review";

    const { error: uErr } = await svca
      .from("good_acts")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", body.actId);
    if (uErr) return NextResponse.json({ error: uErr.message }, { status: 400 });

    return NextResponse.json({ ok: true, status: newStatus });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
