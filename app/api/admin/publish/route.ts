// app/api/admin/publish/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSupabaseService } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { id?: string; publish?: boolean };

export async function POST(req: Request) {
  try {
    const { id, publish } = (await req.json().catch(() => ({}))) as Body;
    if (!id || typeof publish !== "boolean") {
      return NextResponse.json({ error: "Missing or invalid id/publish" }, { status: 400 });
    }

    // 1) verify caller is signed in
    const sb = supabaseServer();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 2) verify caller is admin
    const { data: admin } = await sb
      .from("admins" as any)
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // 3) perform privileged update with service role
    const svc = requireSupabaseService();
    const patch: Record<string, any> = { is_published: publish };
    patch.published_at = publish ? new Date().toISOString() : null;

    const { error } = await svc.from("stories" as any).update(patch).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
