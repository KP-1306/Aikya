// app/api/likes/toggle/route.ts
import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { rateLimit } from "@/lib/rateLimit";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSupabaseService } from "@/lib/supabase/service";
import { awardKarma } from "@/lib/karma/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { storyId } = (await req.json()) as { storyId?: string };
    if (!storyId) {
      return NextResponse.json({ error: "Missing storyId" }, { status: 400 });
    }

    const svc = requireSupabaseService();

    // 🔒 Rate limit: 60 like toggles / minute / anon id
    const aid = cookies().get("aid")?.value || "anon";
    const ok = await rateLimit(`${aid}:likes_toggle`, 60, 60_000);
    if (!ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    // Auth
    const sb = supabaseServer();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Toggle like
    const { data: existing, error: getErr } = await svc
      .from("likes")
      .select("id")
      .eq("story_id", storyId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (getErr) return NextResponse.json({ error: getErr.message }, { status: 400 });

    let liked: boolean;
    if (existing) {
      const { error } = await svc.from("likes").delete().eq("id", existing.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      liked = false;
    } else {
      const { error } = await svc
        .from("likes")
        .insert({ story_id: storyId, user_id: user.id });
      if (error && !/duplicate key/i.test(error.message)) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      liked = true;
    }

    // Recount likes
    const { count, error: cntErr } = await svc
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("story_id", storyId);
    if (cntErr) return NextResponse.json({ error: cntErr.message }, { status: 400 });
    const likeCount = count || 0;

    // 🔹 Analytics (best-effort)
    try {
      const ref = headers().get("referer") || headers().get("referrer") || "";
      const ua = headers().get("user-agent") || "";
      await svc.from("analytics_events").insert({
        anon_id: aid, // if your column is 'aid', change key to 'aid'
        kind: "like",
        story_id: storyId,
        user_id: user.id,
        referrer: ref.slice(0, 512),
        ua: ua.slice(0, 512),
      });
    } catch {
      // ignore analytics failures
    }

    // ⭐ Karma (best-effort) — only when a like is added
    if (liked) {
      try {
        // awardKarma(supa, userId, delta, reason, meta?)
        await awardKarma(svc, user.id, 1, "story_liked", { story_id: storyId });
      } catch {
        // ignore karma errors
      }
    }

    return NextResponse.json({ liked, likeCount });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
