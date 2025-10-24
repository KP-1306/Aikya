import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";

/**
 * Deletes a story and its related rows.
 * NOTE:
 * - This deletes from typical dependent tables; adjust table names if different.
 * - If you want storage file deletion, store the storage PATH (not only public URL),
 *   then call supabaseService.storage.from('story-images').remove([path]).
 */
export async function POST(req: Request) {
  try {
    const { id } = await req.json() as { id?: string };
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    // 1) auth + admin
    const sb = supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: admin } = await sb.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // 2) optional: fetch hero_image to remove from storage (if you store PATH)
    // const { data: story } = await supabaseService.from("stories").select("hero_image_path").eq("id", id).single();

    // 3) delete dependent rows first (adjust table names if needed)
    // comments
    await supabaseService.from("comments").delete().eq("story_id", id);
    // likes / saves (if you use a single reactions table, delete there)
    await supabaseService.from("likes").delete().eq("story_id", id).catch(() => ({}));
    await supabaseService.from("saves").delete().eq("story_id", id).catch(() => ({}));
    await supabaseService.from("reactions").delete().eq("story_id", id).catch(() => ({}));
    // sources
    await supabaseService.from("sources").delete().eq("story_id", id).catch(() => ({}));

    // 4) delete the story
    const { error: delErr } = await supabaseService.from("stories").delete().eq("id", id);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 400 });

    // 5) optional: remove storage object(s) if you saved PATH(s)
    // if (story?.hero_image_path) {
    //   await supabaseService.storage.from("story-images").remove([story.hero_image_path]);
    // }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
