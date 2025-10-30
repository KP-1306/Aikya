// app/api/admin/drafts/[id]/resummarize/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSupabaseService } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const sb = supabaseServer();
  const svc = requireSupabaseService();

  const { data: isAdmin } = await sb.rpc("is_admin").single().catch(() => ({ data: false }));
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: draft, error } = await svc
    .from("ingest_drafts")
    .select("id, source_url")
    .eq("id", params.id)
    .single();

  if (error || !draft?.source_url) {
    return NextResponse.json({ error: "Draft not found or missing source_url" }, { status: 404 });
  }

  // Call your existing preview endpoint to regenerate normalized JSON
  const resp = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/admin/ingest/preview?url=${encodeURIComponent(draft.source_url)}`, {
    cache: "no-store",
  });

  if (!resp.ok) {
    return NextResponse.json({ error: `Preview failed (${resp.status})` }, { status: 500 });
  }

  const json = await resp.json();
  const norm = json?.data ?? null;

  if (!norm) return NextResponse.json({ error: "No normalized data" }, { status: 500 });

  const up = await svc
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
