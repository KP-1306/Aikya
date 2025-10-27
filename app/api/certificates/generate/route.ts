// app/api/certificates/generate/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { trySupabaseService } from "@/lib/supabase/service";
import { certificateSVG } from "@/lib/certificates/template";

// Prevent prerender/optimization; run on Node
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { actId } = (await req.json()) as { actId?: string };
    if (!actId) return NextResponse.json({ error: "Missing actId" }, { status: 400 });

    // Auth (anon server client) + admin check
    const sb = supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: admin } = await sb
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!admin) return NextResponse.json({ error: "Admins only" }, { status: 403 });

    // Try service client only at runtime
    const svc = trySupabaseService();
    if (!svc) {
      return NextResponse.json(
        { error: "Server is not configured with SUPABASE_SERVICE_ROLE_KEY." },
        { status: 500 }
      );
    }

    // Fetch act
    const { data: act, error: actErr } = await svc
      .from("good_acts")
      .select("id, person_name, created_at")
      .eq("id", actId)
      .single();
    if (actErr || !act) return NextResponse.json({ error: "Act not found" }, { status: 404 });

    // Prepare SVG
    const svg = certificateSVG({
      actId: act.id,
      personName: act.person_name ?? "Friend of Aikya",
      dateISO: act.created_at ?? undefined,
    });

    // Try to render PNG with Resvg. If not available, fall back to SVG.
    let fileBytes: Uint8Array;
    let contentType: string;
    let ext: "png" | "svg" = "png";

    try {
      // Dynamic import at runtime – won’t break builds if the package is missing
      const mod = await import("@resvg/resvg-js");
      const Resvg = mod.Resvg ?? (mod as any).default;
      const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1600 } });
      fileBytes = resvg.render().asPng();
      contentType = "image/png";
      ext = "png";
    } catch {
      // Fallback: store SVG as-is
      fileBytes = new TextEncoder().encode(svg);
      contentType = "image/svg+xml";
      ext = "svg";
    }

    // Upload to certificates bucket
    const path = `${act.id}/certificate-${Date.now()}.${ext}`;
    const { error: upErr } = await svc.storage.from("certificates").upload(path, fileBytes, {
      contentType,
      upsert: true,
    });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });

    // Public URL + save back to the act
    const { data: pub } = svc.storage.from("certificates").getPublicUrl(path);
    const url = pub?.publicUrl;

    const { error: updErr } = await svc
      .from("good_acts")
      .update({ certificate_url: url })
      .eq("id", act.id);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

    return NextResponse.json({ ok: true, url, format: ext });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
