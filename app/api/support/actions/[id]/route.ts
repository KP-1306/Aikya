// app/api/support/actions/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const sb = supabaseServer();
  const { data: { user }, error: authErr } = await sb.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await sb
    .from("support_actions")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const sb = supabaseServer();
  const { data: { user }, error: authErr } = await sb.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const allowed = ["title", "description", "city", "state", "evidence_url", "status"];
  const payload: Record<string, any> = {};

  for (const k of allowed) {
    if (k in body) payload[k] = body[k];
  }

  // Owners cannot directly approve/reject; keep to safe statuses
  if ("status" in payload && !["submitted", "in_progress", "done"].includes(payload.status)) {
    delete payload.status;
  }

  const { data, error } = await sb
    .from("support_actions")
    .update(payload)
    .eq("id", params.id)
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
