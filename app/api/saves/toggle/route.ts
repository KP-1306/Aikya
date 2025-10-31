// app/api/saves/toggle/route.ts
import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSupabaseService } from "@/lib/supabase/service";
import { awardKarma } from "@/lib/karma/server"; // ✅ correct alias

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { storyId } = (await req.json()) as { storyId?: string };
    if (!storyId) {
      return NextResponse.json({ error: "Missing storyId" }, { status: 400 });
    }

    const supabaseService = requireSupabaseService();

    // Auth
    const sb = supabaseServer();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Toggle save
    const { data: existing, error: getErr } = await supabaseService
      .from("saves")
      .select("id")
      .eq("story_id", storyId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (getErr) return NextResponse.json({ error: getErr.message }, { status: 400 });

    let saved: boolean;
    if (existing) {
      const { error } = await supabaseService.from("saves").delete().eq("id", existing.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      saved = false;
    } else {
      const { error } = await supabaseService
        .from("saves")
        .insert({ story_id: storyId, user_id: user.id });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      saved = true;
    }

    // Recount (optional)
    const { count, error: cntErr } = await supabaseService
      .from("saves")
      .select("*", { count: "exact", head: true })
      .eq("story_id", storyId);
    if (cntErr) return NextResponse.json({ error: cntErr.message }, { status: 400 });
    const saveCount = count || 0;

    // Analytics (best-effort)
    try {
      const anon = cookies().get("aid")?.value;
      const ref = headers().get("referer") || headers().get("referrer") || "";
      const ua = headers().get("user-agent") || "";
      await supabaseService.from("analytics_events").insert({
        kind: "save",
        story_id: storyId,
        user_id: user.id,
        anon_id: anon ?? crypto.randomUUID(),
        referrer: ref.slice(0, 512),
        ua: ua.slice(0, 512),
      });
    } catch {
      // ignore analytics errors
    }

    // Karma (best-effort)
    if (saved) {
      try {
        // 4th arg must match KarmaReason type → use snake_case
        await awardKarma(user.id, "save", 1, { story_id: storyId });
      } catch {
        // ignore karma errors
      }
    }

    return NextResponse.json({ saved, saveCount });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
