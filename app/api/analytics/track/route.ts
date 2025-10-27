// app/api/analytics/track/route.ts
import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSupabaseService } from "@/lib/supabase/service";


type Payload = {
  kind: "pageview" | "like" | "save";
  path?: string;
  storyId?: string;   // client may send camelCase
  story_id?: string;  // or snake_case — we normalize below
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload;
    if (!body?.kind) {
      return NextResponse.json({ error: "Missing kind" }, { status: 400 });
    }

    const supabaseService = requireSupabaseService();

    
    // Normalize fields
    const kind = body.kind;
    const path = (body.path ?? "").slice(0, 512) || null;
    const story_id = (body.story_id ?? body.storyId) || null;

    // Anonymous id cookie
    const c = cookies();
    const aid = c.get("aid")?.value;
    if (!aid) {
      return NextResponse.json({ error: "Missing anon cookie" }, { status: 400 });
    }

    // Best-effort user (optional)
    const { data: { user } } = await supabaseServer().auth.getUser();
    const user_id = user?.id ?? null;

    // Context
    const h = headers();
    const referrer = (h.get("referer") || h.get("referrer") || "").slice(0, 512);
    const ua = (h.get("user-agent") || "").slice(0, 512);

    // NOTE: This expects columns: aid, kind, path, story_id, user_id, referrer, ua
    // If your table uses `anon_id` instead of `aid`, change `aid` below to `anon_id`.
    const { error } = await supabaseService.from("analytics_events").insert({
      aid,
      kind,
      path,
      story_id,
      user_id,
      referrer,
      ua,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
