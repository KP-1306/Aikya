// app/api/admin/stories/delete/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSupabaseService } from "@/lib/supabase/service";

export const runtime = "nodejs";

function wantsHtml(req: Request) {
  return (req.headers.get("accept") || "").includes("text/html");
}

async function isAdminOrOwner() {
  const sb = supabaseServer();
  const { data: userRes } = await sb.auth.getUser();
  const user = userRes?.user;
  if (!user) return { ok: false as const, userId: null };

  // Prefer RPC
  try {
    const { data, error } = await sb.rpc("is_admin").single();
    if (!error && (data as unknown as boolean) === true) {
      return { ok: true as const, userId: user.id };
    }
  } catch {
    /* ignore */
  }

  // Fallback: user_profiles → profiles
  let role: string | null = null;

  const up = await sb
    .from("user_profiles" as any)
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!up.error) role = (up.data as any)?.role ?? null;

  if (!role) {
    const pf = await sb
      .from("profiles" as any)
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (!pf.error) role = (pf.data as any)?.role ?? null;
  }

  return { ok: role === "admin" || role === "owner", userId: user.id };
}

export async function POST(req: Request) {
  const admin = await isAdminOrOwner();
  if (!admin.ok) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Parse payload (JSON or FormData)
  const ctype = req.headers.get("content-type") || "";
  let id = "";
  let mode = "soft"; // "soft" | "hard"
  if (ctype.includes("application/json")) {
    const j = (await req.json().catch(() => ({}))) as any;
    id = String(j.id || "");
    mode = String(j.mode || "soft");
  } else {
    const fd = await req.formData().catch(() => null);
    if (fd) {
      id = String(fd.get("id") || "");
      mode = String(fd.get("mode") || "soft");
    }
  }
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (!["soft", "hard"].includes(mode)) mode = "soft";

  const svc = requireSupabaseService();

  // Try RPC first
  const r = await svc.rpc("admin_delete_story", { story_id_in: id, mode_in: mode as "soft" | "hard" });
  if (!r.error) {
    if (wantsHtml(req)) return NextResponse.redirect(new URL("/admin/(content)/drafts", req.url));
    return NextResponse.json({ ok: true, via: "rpc" });
  }

  // Fallbacks if RPC missing or failing
  const msg = r.error?.message || "";
  const rpcMissing = msg.includes("42883") || msg.includes("does not exist") || msg.includes("function admin_delete_story");

  if (!rpcMissing) {
    // Real error from RPC, bubble it
    return NextResponse.json({ error: msg || "Delete failed" }, { status: 500 });
  }

  // Manual fallback
  if (mode === "hard") {
    // Best-effort: delete children first if you have FKs (adjust table names if needed)
    await svc.from("sources" as any).delete().eq("story_id", id);
    const hard = await svc.from("stories" as any).delete().eq("id", id);
    if (hard.error) return NextResponse.json({ error: hard.error.message }, { status: 500 });
  } else {
    // Soft delete: mark deleted_at and unpublish
    const soft = await svc
      .from("stories" as any)
      .update({ deleted_at: new Date().toISOString(), is_published: false })
      .eq("id", id);
    if (soft.error) return NextResponse.json({ error: soft.error.message }, { status: 500 });
  }

  if (wantsHtml(req)) return NextResponse.redirect(new URL("/admin/(content)/drafts", req.url));
  return NextResponse.json({ ok: true, via: "fallback", mode });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
