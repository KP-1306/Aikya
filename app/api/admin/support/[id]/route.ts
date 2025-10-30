// app/api/admin/support/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSupabaseService } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const sb = supabaseServer();
  const svc = requireSupabaseService();

  // Who is calling?
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check admin via DB helper
  const { data: isAdminRow } = await sb.rpc("is_admin").single().catch(() => ({ data: false }));
  if (!isAdminRow) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const nextStatus: string | undefined = body?.status;
  if (!nextStatus || !["verified", "rejected", "in_progress", "done"].includes(nextStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { error } = await svc
    .from("support_actions")
    .update({ status: nextStatus })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
