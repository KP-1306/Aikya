// app/api/admin/partners/create/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSupabaseService } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const sb = supabaseServer();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Admin guard (cast table to any to avoid PostgREST union type error)
    const { data: admin } = await sb
      .from("admins" as any)
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!admin) return NextResponse.json({ error: "Admins only" }, { status: 403 });

    // Parse body
    const { name, upi_id, scopes } = (await req.json()) as {
      name?: string;
      upi_id?: string;
      scopes?: string[];
    };
    if (!name || !upi_id) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    // Service client for writes
    const svc = requireSupabaseService();

    const { error } = await svc.from("partners" as any).insert({
      name,
      upi_id,
      scopes: scopes ?? [],
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
