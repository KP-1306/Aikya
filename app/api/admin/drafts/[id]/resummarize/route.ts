// app/api/admin/drafts/[id]/resummarize/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSupabaseService } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function POST(_req: Request, { params }: Ctx) {
  const sb = supabaseServer();
  const sba = sb as any;                 // <-- single cast
  const svc = requireSupabaseService();
  const svca = svc as any;               // <-- single cast

  // ---- Must be signed in
  const { data: userRes } = await sba.auth.getUser();
  const user = userRes?.user;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ---- Admin/Owner gate
  const isAdmin = await isAdminOrOwner(sb, user.id);
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // ---- Load the draft (service role read is fine here)
  const { data: draft, error } = await svca
    .from("ingest_drafts")
    .select("id, source_url")
    .eq("id", params.id)
    .single();

  if (error || !draft?.source_url) {
    return NextResponse.json({ error: "Draft not found or missing source_url" }, { status: 404 });
  }

  // ---- Call preview endpoint to regenerate normalized JSON
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
    "https://aikyanow.netlify.app";

  const previewUrl = `${base}/api/admin/ingest/preview?url=${encodeURIComponent(
    draft.source_url
  )}`;

  let json: any = null;
  try {
    const resp = await fetch(previewUrl, { cache: "no-store" });
    if (!resp.ok) {
      return NextResponse.json({ error: `Preview failed (${resp.status})` }, { status: 500 });
    }
    json = await resp.json();
  } catch {
    return NextResponse.json({ error: "Preview request failed" }, { status: 500 });
  }

  const norm = json?.data ?? null;
  if (!norm) return NextResponse.json({ error: "No normalized data" }, { status: 500 });

  // ---- Update the draft with normalized fields
  const up = await svca
    .from("ingest_drafts")
    .update({
      draft_json: norm,
      title: norm.title ?? null,
      dek: norm.dek ?? null,
      what: norm.what ?? null,
      why: norm.why ?? null,
      how: norm.how ?? null,
      city: norm.city ?? null,
      state: norm.state ?? null,
      country: norm.country ?? null,
      hero_image: norm.hero_image ?? null,
      status: "needs_review",
    })
    .eq("id", params.id);

  if (up.error) return NextResponse.json({ error: up.error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// ----------------- helpers -----------------
async function isAdminOrOwner(sb: ReturnType<typeof supabaseServer>, userId: string): Promise<boolean> {
  const sba = sb as any;                // <-- single cast inside helper

  // Try RPC is_admin() first
  try {
    const { data, error } = await sba.rpc("is_admin").single();
    if (!error && (data as unknown as boolean) === true) return true;
  } catch {
    // ignore and fall back to role checks
  }

  // Fallback: role from user_profiles, then profiles
  let role: string | null = null;

  const up = await sba
    .from("user_profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (!up.error) role = (up.data as any)?.role ?? null;

  if (!role) {
    const pf = await sba
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    if (!pf.error) role = (pf.data as any)?.role ?? null;
  }

  return role === "admin" || role === "owner";
}
