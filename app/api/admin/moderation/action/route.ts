import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";

export async function POST(req: Request) {
  try {
    const { id, op } = await req.json() as { id?: string; op?: "approve"|"hide"|"ban" };
    if (!id || !op) return NextResponse.json({ error: "Missing id/op" }, { status: 400 });

    // auth + admin
    const sb = supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: admin } = await sb.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // get comment owner for ban
    const { data: row, error: getErr } = await supabaseService
      .from("comments")
      .select("user_id")
      .eq("id", id)
      .single();
    if (getErr) return NextResponse.json({ error: getErr.message }, { status: 400 });

    if (op === "approve") {
      const { error } = await supabaseService.from("comments").update({ status: "approved", flags_count: 0 }).eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    } else if (op === "hide") {
      const { error } = await supabaseService.from("comments").update({ status: "hidden" }).eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    } else if (op === "ban") {
      // create/ensure ban + hide the comment
      const uid = row?.user_id;
      if (uid) {
        await supabaseService.from("bans").upsert({ user_id: uid, reason: "Moderator ban" }, { onConflict: "user_id" });
      }
      const { error } = await supabaseService.from("comments").update({ status: "hidden" }).eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
