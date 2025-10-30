// app/api/admin/stories/delete/route.ts
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

  const ctype = req.headers.get("content-type") || "";
  let id = "", mode = "soft";
  if (ctype.includes("application/json")) {
    const j = await req.json().catch(() => ({}));
    id = String(j.id || "");
    mode = String(j.mode || "soft");
  } else {
    const fd = await req.formData();
    id = String(fd.get("id") || "");
    mode = String(fd.get("mode") || "soft");
  }

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (!["soft","hard"].includes(mode)) mode = "soft";

  const svc = requireSupabaseService();
  const { error } = await svc.rpc("admin_delete_story", { story_id_in: id, mode_in: mode });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.redirect(new URL("/admin/(content)/drafts", req.url));
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
