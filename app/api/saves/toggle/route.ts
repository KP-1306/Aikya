// app/api/saves/toggle/route.ts
import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { rateLimit } from "@/lib/rateLimit";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";

export async function POST(req: Request) {
  try {
    const { storyId } = (await req.json()) as { storyId?: string };
    if (!storyId) {
      return NextResponse.json({ error: "Missing storyId" }, { status: 400 });
    }

    // 🔒 Rate limit: 60 save toggles per minute per anon id
    const aid = cookies().get("aid")?.value || "anon";
    const ok = await rateLimit(`${aid}:saves_toggle`, 60, 60_000);
    if (!ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    // Auth
    const { data: { user } } = await supabaseServer().auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Toggle save: if exists → delete; else → insert
    const { data: existing, error: getErr } = await supabaseService
      .from("saves")
      .select("id")
      .eq("story_id", storyId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (getErr) return NextResponse.json({ error: getErr.message }, { status: 400 });

    let saved: boolean;

    if (existing) {
      const { error } = await supabaseService
        .from("saves")
        .delete()
        .eq("id", existing.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      saved = false;
    } else {
      const { error } = await supabaseService
        .from("saves")
        .insert({ story_id: storyId, user_id: user.id });
      // ignore duplicate key races
      if (error && !/duplicate key/i.test(error.message)) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      saved = true;
    }

    // Recount saves for this story (if you display save count)
    const { count, error: cntErr } = await supabaseService
      .from("saves")
      .select("*", { count: "exact", head: true })
      .eq("story_id", storyId);
    if (cntErr) return NextResponse.json({ error: cntErr.message }, { status: 400 });
    const saveCount = count || 0;

    // 🔹 Analytics (best-effort)
    try {
      const ref = headers().get("referer") || headers().get("referrer") || "";
      const ua = headers().get("user-agent") || "";
      await supabaseService.from("analytics_events").insert({
        aid,                         // if your column is `anon_id`, change to { anon_id: aid, ... }
        kind: "save",
        story_id: storyId,
        user_id: user.id,
        referrer: ref.slice(0, 512),
        ua: ua.slice(0, 512),
      });
    } catch {
      // ignore analytics failures
    }

    return NextResponse.json({ saved, saveCount });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
