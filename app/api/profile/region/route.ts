import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const sb = supabaseServer();
    const {
      data: { user },
      error: userErr,
    } = await sb.auth.getUser();
    if (userErr || !user) {
      return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const city = typeof body.city === "string" && body.city.trim() ? body.city.trim() : null;
    const state = typeof body.state === "string" && body.state.trim() ? body.state.trim() : null;

    // upsert profile row (RLS should allow the owner to update their row)
    const { error } = await sb
      .from("profiles")
      .upsert(
        { id: user.id, city, state },
        { onConflict: "id", ignoreDuplicates: false }
      );

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
