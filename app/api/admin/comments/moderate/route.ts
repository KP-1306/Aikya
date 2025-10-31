// app/api/admin/comments/moderate/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSupabaseService } from "@/lib/supabase/service";

export const runtime = "nodejs";

// Allowed actions for the RPC
type AdminAction = "approve" | "hide" | "ban_user";

// Robust admin check: try RPC is_admin(); fallback to profiles.role === 'admin'
async function checkIsAdmin() {
  const sb = supabaseServer();
  const sba = sb as any; // ← one-time cast to avoid Next/Netlify TS union issue

  // Must be signed in
  const { data: userRes } = await sba.auth.getUser();
  const user = userRes?.user;
  if (!user) return false;

  // Prefer RPC if present
  try {
    const { data, error } = await sba.rpc("is_admin").single();
    if (!error && data === true) return true;
  } catch {
    // ignore; fall back to profile check
  }

  // Fallback: profiles.role
  const { data: profile } = await sba
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return profile?.role === "admin";
}

// Parse id + action from JSON or FormData
async function parsePayload(req: Request): Promise<{ id: string; action: AdminAction } | null> {
  const ctype = req.headers.get("content-type") || "";
  let id = "";
  let action = "";

  if (ctype.includes("application/json")) {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    id = String(body.id ?? "");
    action = String(body.action ?? "");
  } else {
    const fd = await req.formData().catch(() => null);
    if (fd) {
      id = String(fd.get("id") ?? "");
      action = String(fd.get("action") ?? "");
    }
  }

  const valid = ["approve", "hide", "ban_user"].includes(action);
  if (!id || !valid) return null;
  return { id, action: action as AdminAction };
}

function wantsHtml(req: Request): boolean {
  const accept = req.headers.get("accept") || "";
  return accept.includes("text/html");
}

export async function POST(req: Request) {
  // AuthZ
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Payload
  const payload = await parsePayload(req);
  if (!payload) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Execute moderation via service role (bypass RLS)
  const svc = requireSupabaseService();
  const svca = svc as any; // optional cast for consistency

  const { error } = await svca.rpc("admin_moderate_comment", {
    comment_id: payload.id,
    action_in: payload.action,
  });

  if (error) {
    const msg = error.message || "Moderation failed";
    if (!wantsHtml(req)) return NextResponse.json({ error: msg }, { status: 500 });
    const url = new URL("/admin/(content)/flags?error=1", req.url);
    return NextResponse.redirect(url);
  }

  // Success
  if (!wantsHtml(req)) {
    return NextResponse.json({ ok: true, id: payload.id, action: payload.action });
  }
  return NextResponse.redirect(new URL("/admin/(content)/flags", req.url));
}

// Optional PATCH support (same semantics)
export async function PATCH(req: Request) {
  return POST(req);
}
