// app/api/admin/drafts/[id]/publish/route.ts
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
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !draft) return NextResponse.json({ error: error?.message || "Draft not found" }, { status: 404 });

  // Construct a story row from draft_json + columns
  const s = draft.draft_json || {};
  const payload = {
    slug: (s.slug || draft.title || "story")
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 90) + "-" + params.id.slice(0, 6),
    title: s.title ?? draft.title,
    dek: s.dek ?? draft.dek,
    what: s.what ?? draft.what,
    why: s.why ?? draft.why,
    how: s.how ?? draft.how,
    city: s.city ?? draft.city,
    state: s.state ?? draft.state,
    country: s.country ?? draft.country ?? "India",
    hero_image: s.hero_image ?? draft.hero_image,
    read_minutes: s.read_minutes ?? draft.read_minutes ?? 3,
    is_published: true,
    published_at: new Date().toISOString(),
    sources: s.sources ?? (draft.source_url ? [{ url: draft.source_url }] : []),
  };

  const ins = await svc.from("stories").insert(payload).select("id, slug").single();
  if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 500 });

  await svc.from("ingest_drafts").update({ status: "published" }).eq("id", params.id);

  return NextResponse.json({ ok: true, story: ins.data });
}
