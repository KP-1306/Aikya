import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSupabaseService } from "@/lib/supabase/service";

export async function POST(req: Request) {
  try {
    const { state, city, interests } = await req.json();
    const sb = supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabaseService = requireSupabaseService();

    const { error } = await supabaseService.from("karma_profiles").upsert({
      user_id: user.id,
      state: state ?? null,
      city: city ?? null,
      interests: Array.isArray(interests) ? interests : []
    }, { onConflict: "user_id" });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
