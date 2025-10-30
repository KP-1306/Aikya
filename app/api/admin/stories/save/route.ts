// app/api/admin/stories/save/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSupabaseService } from "@/lib/supabase/service";

export const runtime = "nodejs";

async function isAdmin(sb: ReturnType<typeof supabaseServer>) {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return false;
  const { data: profile } = await sb.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin";
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
        // accept already-parsed JSON, or a stringified JSON
        update.sources = typeof raw.sources === "string" ? JSON.parse(raw.sources) : raw.sources;
      } catch {
        // ignore bad JSON; don’t set sources
      }
      continue;
    }
    update[k] = typeof raw[k] === "string" ? raw[k].trim() : raw[k];
  }
  return { id, update };
}

export async function POST(req: Request) {
  const sb = supabaseServer();
  if (!(await isAdmin(sb))) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const ctype = req.headers.get("content-type") || "";
  const body: Payload | FormData = ctype.includes("application/json")
    ? (await req.json().catch(() => ({})))
    : (await req.formData());

  // Normalize payload
  const data: any = ctype.includes("application/json")
    ? body
    : Object.fromEntries((body as FormData).entries());

  const { id, update } = coercePayload(data);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (!Object.keys(update).length) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  // Slug uniqueness check (only if slug provided)
  if (update.slug) {
    const { data: dup, error: dupErr } = await sb
      .from("stories")
      .select("id")
      .eq("slug", update.slug)
      .neq("id", id)
      .limit(1);

    if (dupErr) return NextResponse.json({ error: dupErr.message }, { status: 500 });
    if (dup && dup.length > 0) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
  }

  // Persist using service role to bypass RLS complexities on admin edits
  const svc = requireSupabaseService();
  const { error } = await svc.from("stories").update(update).eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Redirect back to drafts if we just published; else stay on admin drafts list
  const url = new URL("/admin/(content)/drafts", req.url);
  return NextResponse.redirect(url);
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
