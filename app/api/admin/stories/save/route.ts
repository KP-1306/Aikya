// app/api/admin/stories/save/route.ts
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

  try {
    const { data, error } = await (sb as any).rpc("is_admin").single();
    if (!error && (data as unknown as boolean) === true) return true;
  } catch { /* ignore */ }

  let role: string | null = null;

  const up = await (sb as any)
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!up.error) role = (up.data as any)?.role ?? null;

  if (!role) {
    const pf = await (sb as any)
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (!pf.error) role = (pf.data as any)?.role ?? null;
  }

  return role === "admin" || role === "owner";
}

type Payload = Partial<{
  id: string;
  slug: string;
  title: string;
  dek: string;
  what: string;
  how: string;
  why: string;
  life_lesson: string;
  city: string;
  state: string;
  country: string;
  hero_image: string;
  read_minutes: number | string;
  sources: unknown; // expect json/jsonb
  is_published: boolean;
}>;

const ALLOWED: (keyof Payload)[] = [
  "slug","title","dek","what","how","why","life_lesson",
  "city","state","country","hero_image","read_minutes","sources","is_published"
];

function coercePayload(raw: any): { id: string; update: Record<string, any> } {
  const id = String(raw.id || "");
  const update: Record<string, any> = {};
  for (const k of ALLOWED) {
    if (raw[k] === undefined) continue;

    if (k === "read_minutes") {
      const n = Number(raw.read_minutes);
      if (Number.isFinite(n) && n > 0) update.read_minutes = Math.round(n);
      continue;
    }

    if (k === "is_published") {
      update.is_published = !!raw.is_published;
      if (update.is_published) update.published_at = new Date().toISOString();
      continue;
    }

    if (k === "sources") {
      try {
        update.sources = typeof raw.sources === "string" ? JSON.parse(raw.sources) : raw.sources;
      } catch { /* ignore bad JSON */ }
      continue;
    }

    update[k] = typeof raw[k] === "string" ? raw[k].trim() : raw[k];
  }
  return { id, update };
}

export async function POST(req: Request) {
  if (!(await isAdminOrOwner())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Read payload (JSON or FormData)
  const ctype = req.headers.get("content-type") || "";
  const body: Payload | FormData = ctype.includes("application/json")
    ? (await req.json().catch(() => ({})))
    : (await req.formData());

  const data: any = ctype.includes("application/json")
    ? body
    : Object.fromEntries((body as FormData).entries());

  const { id, update } = coercePayload(data);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (!Object.keys(update).length) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  // Slug uniqueness (only when provided)
  if (update.slug) {
    const svc = requireSupabaseService(); // service client for reliable read
    const { data: dup, error: dupErr } = await svc
      .from("stories" as any)
      .select("id")
      .eq("slug", update.slug)
      .neq("id", id)
      .limit(1);

    if (dupErr) return NextResponse.json({ error: dupErr.message }, { status: 500 });
    if (Array.isArray(dup) && dup.length > 0) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
  }

  // Persist with service role (bypass RLS for admin edits)
  const svc = requireSupabaseService();
  const { error } = await svc.from("stories" as any).update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (wantsHtml(req)) {
    return NextResponse.redirect(new URL("/admin/(content)/drafts", req.url));
  }
  return NextResponse.json({ ok: true, id, updated: Object.keys(update) });
}
