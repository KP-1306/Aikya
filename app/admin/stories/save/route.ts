// app/admin/stories/save/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";
import { embedText, buildStoryText } from "@/lib/embeddings";

type SourceIn = { name: string; url: string };
type Body = {
  id?: string;                     // present for edit, absent for create
  title: string;
  dek?: string;
  what?: string;
  how?: string;
  why?: string;
  life_lesson?: string;
  country?: string;
  state?: string | null;
  city?: string | null;
  category?: string | null;        // e.g., 'human', 'community', 'global', 'spiritual'
  virtues?: string[];              // optional tags to boost semantic search
  hero_image?: string | null;      // absolute URL or Supabase storage public URL
  hero_alt?: string | null;
  hero_credit?: string | null;
  is_published?: boolean;
  sources?: SourceIn[];
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 90);
}

function sanitizeUrl(u?: string | null) {
  if (!u) return null;
  try {
    const url = new URL(u);
    return url.toString();
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    // Basic validation
    if (!body?.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Auth + admin guard
    const sb = supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: admin } = await sb
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Prepare story fields
    const nowIso = new Date().toISOString();
    const isPublishing = !!body.is_published;

    // If creating a new story, generate slug; if editing, keep existing unless title changes
    let slug = slugify(body.title);

    // Ensure slug is unique on create or when changed (append -2, -3, …)
    async function ensureUniqueSlug(baseline: string, id?: string) {
      let candidate = baseline;
      let i = 2;
      // try to find a conflicting slug that is not "this story"
      // NOTE: we use service client (bypasses RLS)
      while (true) {
        const { data: hit } = await supabaseService
          .from("stories")
          .select("id")
          .eq("slug", candidate)
          .maybeSingle();
        if (!hit || (id && hit.id === id)) return candidate;
        candidate = `${baseline}-${i++}`;
      }
    }

    // Build the row data
    const row = {
      title: body.title,
      dek: body.dek ?? null,
      what: body.what ?? null,
      how: body.how ?? null,
      why: body.why ?? null,
      life_lesson: body.life_lesson ?? null,
      country: body.country ?? "India",
      state: body.state ?? null,
      city: body.city ?? null,
      category: body.category ?? null,
      virtues: body.virtues ?? null,
      hero_image: sanitizeUrl(body.hero_image),
      hero_alt: body.hero_alt ?? null,
      hero_credit: body.hero_credit ?? null,
      is_published: isPublishing,
      // published_at handled below
    };

    let storyId = body.id ?? null;

    if (!storyId) {
      // CREATE
      slug = await ensureUniqueSlug(slug);
      const insertRow = {
        ...row,
        slug,
        published_at: isPublishing ? nowIso : null,
      };
      const { data: created, error: insErr } = await supabaseService
        .from("stories")
        .insert(insertRow)
        .select("id, slug")
        .single();
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 });
      storyId = created.id;
      slug = created.slug;
    } else {
      // EDIT
      // Get existing slug to decide if we need to re-unique
      const { data: existing, error: getErr } = await supabaseService
        .from("stories")
        .select("id, slug, is_published, published_at, title")
        .eq("id", storyId)
        .single();
      if (getErr || !existing) {
        return NextResponse.json({ error: "Story not found" }, { status: 404 });
      }

      // If title changed, compute a new unique slug
      const titleChanged = existing.title !== body.title;
      slug = titleChanged ? await ensureUniqueSlug(slugify(body.title), storyId) : existing.slug;

      // Manage published_at transitions
      let published_at = existing.published_at;
      if (isPublishing && !existing.is_published) {
        // moving from draft → published
        published_at = nowIso;
      }
      if (!isPublishing && existing.is_published) {
        // moving from published → draft
        published_at = null;
      }

      const updateRow = { ...row, slug, published_at };

      const { error: updErr } = await supabaseService
        .from("stories")
        .update(updateRow)
        .eq("id", storyId);
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });
    }

    // Upsert sources: replace the whole set for this story
    if (Array.isArray(body.sources)) {
      // Clear existing first
      await supabaseService.from("sources").delete().eq("story_id", storyId);
      const toInsert = body.sources
        .filter(s => s?.name && s?.url)
        .map(s => ({
          story_id: storyId,
          name: String(s.name).slice(0, 200),
          url: sanitizeUrl(s.url),
        }))
        .filter(s => s.url); // keep only valid urls

      if (toInsert.length) {
        const { error: srcErr } = await supabaseService.from("sources").insert(toInsert);
        if (srcErr) return NextResponse.json({ error: srcErr.message }, { status: 400 });
      }
    }

    // === NEW: Build & save embedding (best-effort; non-fatal on failure) ===
    try {
      // Fetch fresh story fields to embed (ensures we embed final saved text)
      const { data: story } = await supabaseService
        .from("stories")
        .select("id, title, dek, what, how, why, life_lesson, virtues")
        .eq("id", storyId)
        .single();

      if (story) {
        const text = buildStoryText({
          title: story.title,
          dek: story.dek ?? undefined,
          what: story.what ?? undefined,
          how: story.how ?? undefined,
          why: story.why ?? undefined,
          life_lesson: story.life_lesson ?? undefined,
          virtues: story.virtues ?? undefined,
        });
        const vec = await embedText(text); // returns number[]
        // Save into stories.embedding (pgvector column)
        await supabaseService.from("stories").update({ embedding: vec }).eq("id", story.id);
      }
    } catch (e) {
      // Swallow embedding errors for now; wire Sentry if needed
      // console.error("Embedding update failed:", e);
    }

    return NextResponse.json({ ok: true, id: storyId, slug });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
