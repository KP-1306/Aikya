// app/api/admin/comments/moderate/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSupabaseService } from "@/lib/supabase/service";

export const runtime = "nodejs";

async function isAdmin(sb: ReturnType<typeof supabaseServer>) {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return false;
  const { data: profile } = await sb.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin";
}

export async function POST(req: Request) {
  const sb = supabaseServer();
  if (!(await isAdmin(sb))) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  let id = "", action = "";
  const ctype = req.headers.get("content-type") || "";
  if (ctype.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    id = String(body.id || "");
    action = String(body.action || "");
  } else {
    const fd = await req.formData();
    id = String(fd.get("id") || "");
    action = String(fd.get("action") || "");
  }

  if (!id || !["approve","hide","ban_user"].includes(action)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const svc = requireSupabaseService();
  const { error } = await svc.rpc("admin_moderate_comment", { comment_id: id, action_in: action });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.redirect(new URL("/admin/(content)/flags", req.url));
}
