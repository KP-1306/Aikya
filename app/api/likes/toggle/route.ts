import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { story_id, like } = await req.json() as { story_id: string; like: boolean };
    if (!story_id) return NextResponse.json({ error: "story_id required" }, { status: 400 });

    const sb = supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (like) {
      const { error } = await sb.from("likes").upsert({ story_id, user_id: user.id });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    } else {
      const { error } = await sb.from("likes").delete().eq("story_id", story_id).eq("user_id", user.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // return fresh count from view
    const { data: countRow } = await sb.from("story_like_counts").select("likes").eq("story_id", story_id).maybeSingle();
    return NextResponse.json({ ok: true, likes: countRow?.likes ?? 0 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
