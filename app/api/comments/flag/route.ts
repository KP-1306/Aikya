// app/api/comments/flag/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";

const FLAG_THRESHOLD = 3; // auto-mark as "flagged" at this count

export async function POST(req: Request) {
  try {
    const { commentId } = (await req.json()) as { commentId?: string | number };
    if (commentId == null) {
      return NextResponse.json({ error: "Missing commentId" }, { status: 400 });
    }

    // comments.id is BIGINT in your DB → coerce to number for comparisons / FKs
    const idNum = typeof commentId === "string" ? Number(commentId) : commentId;
    if (!Number.isFinite(idNum)) {
      return NextResponse.json({ error: "Invalid commentId" }, { status: 400 });
    }

    // Auth
    const sb = supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get comment (prevent self-flag if desired)
    const { data: cmt, error: getErr } = await supabaseService
      .from("comments")
      .select("id, user_id, status, flags_count")
      .eq("id", idNum)
      .single();

    if (getErr || !cmt) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (cmt.user_id === user.id) {
      return NextResponse.json({ error: "You cannot flag your own comment." }, { status: 400 });
    }

    // Record flag (unique per user/comment via PK(comment_id, user_id))
    const { error: upErr } = await supabaseService
      .from("comment_flags")
      .insert({ comment_id: idNum, user_id: user.id });

    // Ignore duplicate-key errors (user already flagged)
    if (upErr && !/duplicate key/i.test(upErr.message)) {
      return NextResponse.json({ error: upErr.message }, { status: 400 });
    }

    // Recompute count from flags table
    const { count, error: cntErr } = await supabaseService
      .from("comment_flags")
      .select("*", { count: "exact", head: true })
      .eq("comment_id", idNum);
    if (cntErr) return NextResponse.json({ error: cntErr.message }, { status: 400 });

    const flags = count || 0;

    // Update flags_count and maybe status
    const patch: Record<string, any> = { flags_count: flags };
    if (flags >= FLAG_THRESHOLD && cmt.status !== "flagged" && cmt.status !== "hidden") {
      patch.status = "flagged"; // show in moderation queue
    }

    const { error: updErr } = await supabaseService
      .from("comments")
      .update(patch)
      .eq("id", idNum);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

    return NextResponse.json({ ok: true, flags });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
