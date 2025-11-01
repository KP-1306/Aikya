// app/api/admin/moderation/action/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSupabaseService } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { id, op } = (await req.json()) as { id?: string; op?: "approve" | "hide" | "ban" };
    if (!id || !op) return NextResponse.json({ error: "Missing id/op" }, { status: 400 });

    const svc = requireSupabaseService();

    // --- Auth + admin (cast the server client once to avoid TS union callability error)
    const sb = supabaseServer();
    const sba = sb as any;

    const {
      data: { user },
    } = await sba.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: admin } = await sba
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // --- Get comment owner for potential ban
    const { data: row, error: getErr } = await svc
      .from("comments" as any)
      .select("user_id")
      .eq("id", id)
      .single();
    if (getErr) return NextResponse.json({ error: getErr.message }, { status: 400 });

    if (op === "approve") {
      const { error } = await svc
        .from("comments" as any)
        .update({ status: "approved", flags_count: 0 })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    } else if (op === "hide") {
      const { error } = await svc.from("comments" as any).update({ status: "hidden" }).eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    } else if (op === "ban") {
      const uid = row?.user_id;
      if (uid) {
        await svc
          .from("bans" as any)
          .upsert({ user_id: uid, reason: "Moderator ban" }, { onConflict: "user_id" });
      }
      const { error } = await svc.from("comments" as any).update({ status: "hidden" }).eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
