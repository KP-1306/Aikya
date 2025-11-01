// app/api/admin/stories/publish/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSupabaseService } from "@/lib/supabase/service";

export const runtime = "nodejs";

function wantsHtml(req: Request) {
  return (req.headers.get("accept") || "").includes("text/html");
}

async function isAdminOrOwner(): Promise<boolean> {
  const sb = supabaseServer();
  const { data: userRes } = await sb.auth.getUser();
  const user = userRes?.user;
  if (!user) return false;

  // Prefer RPC if present
  try {
    const { data, error } = await sb.rpc("is_admin").single();
    if (!error && (data as unknown as boolean) === true) return true;
  } catch {
    /* ignore */
  }

  // Fallback: user_profiles → profiles (with safe casts)
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

  return role === "admin" || role === "owner";
}

export async function POST(req: Request) {
  // AuthZ
  if (!(await isAdminOrOwner())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Payload: support JSON and FormData
  const ctype = req.headers.get("content-type") || "";
  let id = "";
  let publish: boolean | null = null;

  if (ctype.includes("application/json")) {
    const j = (await req.json().catch(() => ({}))) as { id?: string; publish?: boolean };
    id = String(j.id ?? "");
    publish = typeof j.publish === "boolean" ? j.publish : true;
  } else {
    const fd = await req.formData().catch(() => null);
    if (fd) {
      id = String(fd.get("id") ?? "");
      const p = fd.get("publish");
      publish = p == null ? true : String(p) === "true";
    }
  }

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Update with service role
  const svc = requireSupabaseService();
  const patch: any =
    publish
      ? { is_published: true, published_at: new Date().toISOString() }
      : { is_published: false };

  const { error } = await svc.from("stories" as any).update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (wantsHtml(req)) {
    return NextResponse.redirect(new URL("/admin/(content)/drafts", req.url));
  }
  return NextResponse.json({ ok: true, id, publish: !!publish });
}
