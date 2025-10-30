// app/api/admin/stories/publish/route.ts
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

  const fd = await req.formData();
  const id = String(fd.get("id") || "");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const svc = requireSupabaseService();
  const { error } = await svc
    .from("stories")
    .update({ is_published: true, published_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.redirect(new URL("/admin/(content)/drafts", req.url));
}
