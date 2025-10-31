// app/api/admin/acts/[id]/status/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSupabaseService } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

// Allowed statuses (map aliases if you want "approved" → "verified")
const ALLOWED = new Set(["verified", "rejected", "in_progress", "done", "approved"]);

export async function PATCH(req: Request, { params }: Ctx) {
  const sb = supabaseServer();

  // ---- Auth (must be signed in) ----
  const { data: userRes } = await sb.auth.getUser();
  const user = userRes?.user;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ---- Admin/Owner gate (no .catch chaining) ----
  const isAdmin = await isAdminOrOwner(sb, user.id);
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // ---- Parse body safely ----
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  let status: string | undefined = body?.status?.toString().trim();

  if (!status || !ALLOWED.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  // Optional alias: treat "approved" as "verified"
  if (status === "approved") status = "verified";

  const id = params.id;
  const svc = requireSupabaseService(); // service role for write

  // ---- Try updating primary table ----
  const upd1 = await svc.from("good_acts").update({ status }).eq("id", id);
  if (!upd1.error) {
    return NextResponse.json({ ok: true, table: "good_acts", id, status });
  }

  // ---- Fallback to "acts" if this env uses a different table name ----
  const upd2 = await svc.from("acts").update({ status }).eq("id", id);
  if (!upd2.error) {
    return NextResponse.json({ ok: true, table: "acts", id, status });
  }

  // ---- Both failed → return best error ----
  const msg = upd2.error?.message ?? upd1.error?.message ?? "Update failed";
  return NextResponse.json({ error: msg }, { status: 500 });
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

  // Fallback: check role from user_profiles, then profiles
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
