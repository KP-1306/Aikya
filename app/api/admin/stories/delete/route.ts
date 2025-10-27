// app/api/admin/stories/delete/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSupabaseService } from "@/lib/supabase/service";


export const runtime = "nodejs"; // ensure Node runtime

export async function POST(req: Request) {
  try {
    const { id } = (await req.json()) as { id?: string };
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const supabaseService = requireSupabaseService();

    // Auth + admin check
    const sb = supabaseServer();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: admin } = await sb
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Helper: delete from a table by story_id, swallow individual errors
    async function deleteByStoryId(table: string) {
      try {
        const { error } = await supabaseService.from(table).delete().eq("story_id", id);
        if (error) {
          // log but don't fail whole request
          console.warn(`[delete/${table}]`, error.message);
        }
      } catch (e: any) {
        console.warn(`[delete/${table}] unexpected`, e?.message || e);
      }
    }

    // Delete children first (order matters if FKs don’t cascade)
    await deleteByStoryId("comments");
    await deleteByStoryId("likes");
    await deleteByStoryId("saves");
    // If you have a combined reactions table, keep this; otherwise it’s a no-op
    await deleteByStoryId("reactions");
    await deleteByStoryId("sources");

    // Finally, delete the story itself
    const { error: storyErr } = await supabaseService.from("stories").delete().eq("id", id);
    if (storyErr) return NextResponse.json({ error: storyErr.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
