import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";
import { toSlug } from "@/lib/slug";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1) auth + admin
    const sb = supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: admin } = await sb.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // 2) normalize
    const slug = toSlug(body.title || body.slug || "");
    if (!slug) return NextResponse.json({ error: "Title required" }, { status: 400 });

    const patch: any = {
      slug,
      title: body.title ?? "",
      dek: body.dek ?? "",
      category: body.category ?? "ActsOfKindness",
      city: body.city || null,
      state: body.state || null,
      country: body.country || "IN",
      what: body.what ?? "",
      how: body.how ?? "",
      why: body.why ?? "",
      life_lesson: body.life_lesson ?? "",
      read_minutes: body.read_minutes ?? 3,
      hero_image: body.hero_image || null,
      hero_alt: body.hero_alt || null,
      hero_credit: body.hero_credit || null,
    };

    if (body.is_published) {
      patch.is_published = true;
      patch.published_at = new Date().toISOString();
    } else {
      patch.is_published = false;
    }

    // 3) upsert (if id present → update)
    let q = supabaseService.from("stories");
    const { data, error } = body.id
      ? await q.update(patch).eq("id", body.id).select("id, slug").single()
      : await q.insert(patch).select("id, slug").single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // 4) sources (optional): replace existing sources with provided set
    const sources: { name: string; url: string }[] = Array.isArray(body.sources) ? body.sources : [];
    if (sources.length) {
      await supabaseService.from("sources").delete().eq("story_id", data.id);
      const payload = sources.map((s) => ({
        story_id: data.id,
        name: s.name || new URL(s.url).hostname,
        url: s.url,
      }));
      // Ignore insert error detail in response; surface succinct message
      const { error: srcErr } = await supabaseService.from("sources").insert(payload);
      if (srcErr) return NextResponse.json({ error: srcErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, id: data.id, slug: data.slug });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
