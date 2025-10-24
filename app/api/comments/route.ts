import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { body, story_id } = await req.json() as { body: string; story_id: string };
    if (!body || !story_id) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const sb = supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Basic server-side validation
    const clean = body.trim();
    if (clean.length < 3) return NextResponse.json({ error: "Too short" }, { status: 400 });
    if (clean.length > 2000) return NextResponse.json({ error: "Too long" }, { status: 400 });

    const { error } = await sb.from("comments").insert({
      story_id,
      author_id: user.id,
      body: clean,
      // is_approved defaults false; moderators approve later
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
