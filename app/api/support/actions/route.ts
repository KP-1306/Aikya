// app/api/support/actions/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const sb = supabaseServer();
  const { data: { user }, error: authErr } = await sb.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await sb
    .from("support_actions")
    .select("id, title, status, city, state, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const sb = supabaseServer();
  const { data: { user }, error: authErr } = await sb.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { title, description, city, state, story_id, evidence_url } = body || {};

  if (!title || typeof title !== "string" || title.trim().length < 3) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const { data, error } = await sb
    .from("support_actions")
    .insert({
      user_id: user.id,
      story_id: story_id ?? null,
      title: title.trim(),
      description: typeof description === "string" ? description.trim() : null,
      city: typeof city === "string" ? city.trim() : null,
      state: typeof state === "string" ? state.trim() : null,
      evidence_url: typeof evidence_url === "string" ? evidence_url.trim() : null,
      status: "submitted",
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
