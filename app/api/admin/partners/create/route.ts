import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";

export async function POST(req: Request) {
  try {
    const sb = supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: admin } = await sb.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
    if (!admin) return NextResponse.json({ error: "Admins only" }, { status: 403 });

    const { name, upi_id, scopes } = await req.json() as { name?: string; upi_id?: string; scopes?: string[] };
    if (!name || !upi_id) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const { error } = await supabaseService.from("partners").insert({
      name, upi_id, scopes: scopes ?? []
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
