import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";

export async function POST(req: Request) {
  try {
    const { id } = await req.json() as { id?: string };
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    // admin auth
    const sb = supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: admin } = await sb.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // read current status
    const { data: row, error: getErr } = await supabaseService
      .from("support_requests")
      .select("status")
      .eq("id", id)
      .single();
    if (getErr || !row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const hidden = row.status === "hidden";
    const nextStatus = hidden ? "open" : "hidden";

    const { error: updErr } = await supabaseService
      .from("support_requests")
      .update({ status: nextStatus })
      .eq("id", id);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

    return NextResponse.json({ ok: true, hidden: !hidden, status: nextStatus });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
