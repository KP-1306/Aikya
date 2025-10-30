// app/api/certificates/generate/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { trySupabaseService } from "@/lib/supabase/service";
import { certificateSVG } from "@/lib/certificates/template";

export const dynamic = "force-dynamic"; // always run on server
export const runtime = "nodejs";        // ensure Node runtime on Netlify

export async function POST(req: Request) {
  try {
    const { actId } = (await req.json().catch(() => ({}))) as { actId?: string };
    if (!actId) {
      return NextResponse.json({ error: "Missing actId" }, { status: 400 });
    }

    // Auth: must be signed in AND in admins table
    const sb = supabaseServer();
    const { data: auth } = await sb.auth.getUser();
    const user = auth?.user ?? null;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: admin } = await sb
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!admin) {
      return NextResponse.json({ error: "Admins only" }, { status: 403 });
    }

    // Service client (runtime only). If not configured, fail clearly without breaking build.
    const svc = trySupabaseService();
    if (!svc) {
      return NextResponse.json(
        { error: "Server is not configured with SUPABASE_SERVICE_ROLE_KEY." },
        { status: 500 }
      );
    }

    // Fetch the Good Act (adjust columns if your schema differs)
    const { data: act, error: actErr } = await svc
      .from("good_acts")
      .select("id, person_name, created_at")
      .eq("id", actId)
      .single();

    if (actErr || !act) {
      return NextResponse.json({ error: "Act not found" }, { status: 404 });
    }

    // Generate SVG (no PNG rendering to keep builds clean)
    const svg = certificateSVG({
      actId: act.id,
      personName: act.person_name ?? "Friend of Aikya",
      dateISO: act.created_at ?? undefined,
    });

    // Upload SVG bytes to the 'certificates' bucket
    const bytes = new TextEncoder().encode(svg);
    const contentType = "image/svg+xml";
    const path = `${act.id}/certificate-${Date.now()}.svg`;

    const { error: upErr } = await svc.storage
      .from("certificates")
      .upload(path, bytes, { contentType, upsert: true });

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 400 });
    }

    // Get public URL and persist back on the act
    const { data: pub } = svc.storage.from("certificates").getPublicUrl(path);
    const url = pub?.publicUrl ?? null;

    const { error: updErr } = await svc
      .from("good_acts")
      .update({ certificate_url: url })
      .eq("id", act.id);

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, url, format: "svg" });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
