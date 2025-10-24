import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { id, approve } = await req.json() as { id: number; approve: boolean };
    const sb = supabaseServer();

    // must be signed in & be a moderator (RLS also enforces)
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: mod } = await sb.from("moderators").select("user_id").eq("user_id", user.id).maybeSingle();
    if (!mod) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { error } = await sb.from("comments").update({ is_approved: !!approve }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
