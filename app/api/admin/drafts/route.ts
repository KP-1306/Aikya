// app/api/admin/drafts/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const sb = supabaseServer();
  const { data: isAdmin } = await sb.rpc("is_admin").single().catch(() => ({ data: false }));
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await sb
    .from("ingest_drafts")
    .select("id, title, dek, source_url, status, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
