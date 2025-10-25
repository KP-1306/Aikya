import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";

const FLAG_THRESHOLD = 3; // auto-mark as "flagged" at this count

export async function POST(req: Request) {
  try {
    const { commentId } = await req.json() as { commentId?: string };
    if (!commentId) return NextResponse.json({ error: "Missing commentId" }, { status: 400 });

    // Auth
    const sb = supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get comment owner (prevent self-flag if you want)
    const { data: cmt, error: getErr } = await supabaseService
      .from("comments")
      .select("id, user_id, status, flags_count")
      .eq("id", commentId)
      .single();
    if (getErr || !cmt) return NextResponse.json({ error: "Comment not found" }, { status: 404 });

    if (cmt.user_id === user.id) {
      return NextResponse.json({ error: "You cannot flag your own comment." }, { status: 400 });
    }

    // Record flag (unique per user/comment)
    const { error: upErr } = await supabaseService
      .from("comment_flags")
      .insert({ comment_id: commentId, user_id: user.id });
    if (upErr && !upErr.message.includes("duplicate key")) {
      // If duplicate, we silently accept; otherwise error
      return NextResponse.json({ error: upErr.message }, { status: 400 });
    }

    // Recompute count from flags table
    const { count, error: cntErr } = await supabaseService
      .from("comment_flags")
      .select("*", { count: "exact", head: true })
      .eq("comment_id", commentId);
    if (cntErr) return NextResponse.json({ error: cntErr.message }, { status: 400 });

    const flags = count || 0;

    // Update flags_count and maybe status
    const patch: any = { flags_count: flags };
    if (flags >= FLAG_THRESHOLD && cmt.status !== "flagged" && cmt.status !== "hidden") {
      patch.status = "flagged"; // surface to moderation queue
    }

    const { error: updErr } = await supabaseService
      .from("comments")
      .update(patch)
      .eq("id", commentId);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

    return NextResponse.json({ ok: true, flags });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
