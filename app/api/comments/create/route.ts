// app/api/comments/create/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSupabaseService } from "@/lib/supabase/service";

import { rateLimit } from "@/lib/rateLimit";

function sanitizeBody(s: string) {
  // super-minimal: trim, collapse whitespace, strip control chars
  return s.replace(/\s+/g, " ").replace(/[\u0000-\u001f\u007f]/g, "").trim();
}

export async function POST(req: Request) {
  try {
    const { storyId, body } = (await req.json()) as { storyId?: string; body?: string };
    if (!storyId || !body) {
      return NextResponse.json({ error: "Missing storyId/body" }, { status: 400 });
    }
const supabaseService = requireSupabaseService();

    // 🔒 Per-anon rate limit (10 comments per minute)
    const aid = cookies().get("aid")?.value || "anon";
    const allowed = await rateLimit(`${aid}:comments_create`, 10, 60_000);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // Auth
    const sb = supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Ban check
    const { data: ban } = await sb
      .from("bans")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (ban) {
      return NextResponse.json({ error: "You are banned from commenting." }, { status: 403 });
    }

    // Optional: ensure story exists
    const { data: story, error: storyErr } = await supabaseService
      .from("stories")
      .select("id, is_published")
      .eq("id", storyId)
      .maybeSingle();
    if (storyErr || !story) {
      return NextResponse.json({ error: "Story not found." }, { status: 404 });
    }

    const text = sanitizeBody(body);
    if (!text || text.length < 2) {
      return NextResponse.json({ error: "Comment too short." }, { status: 400 });
    }
    if (text.length > 2000) {
      return NextResponse.json({ error: "Comment too long." }, { status: 400 });
    }

    // Insert comment (default to 'pending'; change to 'approved' if desired)
    const { data: inserted, error } = await supabaseService
      .from("comments")
      .insert({
        story_id: storyId,
        user_id: user.id,
        body: text,
        status: "pending",
        flags_count: 0,
      })
      .select("id, status")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, id: inserted.id, status: inserted.status });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
