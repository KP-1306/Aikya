// app/api/admin/support/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSupabaseService } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function PATCH(req: Request, { params }: Ctx) {
  const sb = supabaseServer();
  const svc = requireSupabaseService();

  // ---- Who is calling?
  const { data: userRes } = await sb.auth.getUser();
  const user = userRes?.user;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ---- Admin/Owner gate (no .catch chaining)
  const isAdmin = await isAdminOrOwner(sb, user.id);
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // ---- Parse body safely
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const nextStatus: string | undefined = body?.status?.toString().trim();
  const ALLOWED = new Set(["verified", "rejected", "in_progress", "done"]);
  if (!nextStatus || !ALLOWED.has(nextStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // ---- Update (service role write)
  const { error } = await svc
    .from("support_actions")
    .update({ status: nextStatus })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: params.id, status: nextStatus });
}

// ----------------- helpers -----------------
async function isAdminOrOwner(sb: ReturnType<typeof supabaseServer>, userId: string): Promise<boolean> {
  // Try RPC is_admin() first
  try {
    const { data, error } = await sb.rpc("is_admin").single();
    if (!error && (data as unknown as boolean) === true) return true;
  } catch {
    // ignore and fall back to role checks
  }

  // Fallback: role from user_profiles, then profiles
  let role: string | null = null;

  const up = await sb
    .from("user_profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (!up.error) role = (up.data as any)?.role ?? null;

  if (!role) {
    const pf = await sb
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    if (!pf.error) role = (pf.data as any)?.role ?? null;
  }

  return role === "admin" || role === "owner";
}
