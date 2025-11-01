// app/api/admin/drafts/[id]/publish/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSupabaseService } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function POST(_req: Request, { params }: Ctx) {
  const sb = supabaseServer();
  const svc = requireSupabaseService();

  // ---- Must be signed in
  const { data: userRes } = await sb.auth.getUser();
  const user = userRes?.user;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ---- Admin/Owner gate
  if (!(await isAdminOrOwner(sb, user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ---- Load draft
  const { data: draft, error } = await svc
    .from("ingest_drafts" as any)
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !draft) {
    return NextResponse.json(
      { error: error?.message || "Draft not found" },
      { status: 404 }
    );
  }

  // ---- Build story payload from draft_json + columns
  const s = (draft as any).draft_json ?? {};
  const baseSlug = (
    (s.slug || draft.title || "story").toString().toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 90)
  );

  const payload = {
    slug: `${baseSlug}-${params.id.slice(0, 6)}`,
    title: s.title ?? draft.title ?? null,
    dek: s.dek ?? draft.dek ?? null,
    what: s.what ?? draft.what ?? null,
    why: s.why ?? draft.why ?? null,
    how: s.how ?? draft.how ?? null,
    // normalize life_lesson from either life_lesson or lifeLesson
    life_lesson: s.life_lesson ?? s.lifeLesson ?? draft.life_lesson ?? null,
    city: s.city ?? draft.city ?? null,
    state: s.state ?? draft.state ?? null,
    country: s.country ?? draft.country ?? "India",
    hero_image: s.hero_image ?? draft.hero_image ?? null,
    read_minutes: s.read_minutes ?? draft.read_minutes ?? 3,
    is_published: true,
    published_at: new Date().toISOString(),
    sources: s.sources ?? (draft.source_url ? [{ url: draft.source_url }] : []),
  };

  // ---- Insert story
  const ins = await svc.from("stories" as any).insert(payload).select("id, slug").single();
  if (ins.error) {
    return NextResponse.json({ error: ins.error.message }, { status: 500 });
  }

  // ---- Mark draft as published (best-effort)
  await svc.from("ingest_drafts" as any).update({ status: "published" }).eq("id", params.id);

  return NextResponse.json({ ok: true, story: ins.data });
}

// ----------------- helpers -----------------
async function isAdminOrOwner(sb: ReturnType<typeof supabaseServer>, userId: string): Promise<boolean> {
  try {
    const { data, error } = await (sb as any).rpc("is_admin").single();
    if (!error && (data as unknown as boolean) === true) return true;
  } catch {
    // ignore
  }

  // fallback to role from user_profiles, then profiles
  let role: string | null = null;

  const up = await (sb as any)
    .from("user_profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (!up.error) role = (up.data as any)?.role ?? null;

  if (!role) {
    const pf = await (sb as any)
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    if (!pf.error) role = (pf.data as any)?.role ?? null;
  }

  return role === "admin" || role === "owner";
}
