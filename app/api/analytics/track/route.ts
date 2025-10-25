import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";

type Payload = {
  kind: "pageview" | "like" | "save";
  path?: string;
  storyId?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload;
    if (!body?.kind) return NextResponse.json({ error: "Missing kind" }, { status: 400 });

    const sb = supabaseServer();
    const { data: { user } } = await sb.auth.getUser();

    const c = cookies();
    const anon = c.get("aid")?.value;
    if (!anon) return NextResponse.json({ error: "Missing anon id cookie" }, { status: 400 });

    const h = headers();
    const referrer = h.get("referer") || h.get("referrer") || "";
    const ua = h.get("user-agent") || "";

    const { error } = await supabaseService.from("analytics_events").insert({
      kind: body.kind,
      path: body.path?.slice(0, 512) || null,
      story_id: body.storyId || null,
      user_id: user?.id || null,
      anon_id: anon,
      referrer: referrer.slice(0, 512),
      ua: ua.slice(0, 512),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
