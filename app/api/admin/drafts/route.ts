// app/api/admin/drafts/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const sb = supabaseServer();

  // Must be signed in (keeps behavior close to your original 403 flow)
  const { data: userRes } = await sb.auth.getUser();
  const user = userRes?.user;
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Admin/owner gate — no `.catch()` on PostgREST builders
  let isAdmin = false;
  try {
    const { data, error } = await sb.rpc("is_admin").single();
    if (!error && (data as unknown as boolean) === true) isAdmin = true;
  } catch {
    // ignore and fall back to role tables
  }

  if (!isAdmin) {
    // fallback to role from user_profiles → profiles
    let role: string | null = null;

    const up = await sb
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (!up.error) role = (up.data as any)?.role ?? null;

    if (!role) {
      const pf = await sb
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (!pf.error) role = (pf.data as any)?.role ?? null;
    }

    if (role !== "admin" && role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Load drafts (unchanged selection)
  const { data, error } = await sb
    .from("ingest_drafts")
    .select("id, title, dek, source_url, status, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}
