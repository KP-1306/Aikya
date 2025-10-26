// app/api/certificates/generate/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";
import { certificateSVG } from "@/lib/certificates/template";

export const runtime = "nodejs"; // ensure Node runtime (not Edge)

export async function POST(req: Request) {
  try {
    const { actId } = (await req.json()) as { actId?: string };
    if (!actId) {
      return NextResponse.json({ error: "Missing actId" }, { status: 400 });
    }

    // Must be signed in + admin
    const sb = supabaseServer();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: admin } = await sb
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!admin) return NextResponse.json({ error: "Admins only" }, { status: 403 });

    // Load the act (adjust fields as per your schema)
    const { data: act, error: actErr } = await supabaseService
      .from("good_acts")
      .select("id, person_name, created_at")
      .eq("id", actId)
      .single();

    if (actErr || !act) {
      return NextResponse.json({ error: "Act not found" }, { status: 404 });
    }

    // Build SVG for the certificate
    const svg = certificateSVG({
      actId: act.id,
      personName: act.person_name ?? "Friend of Aikya",
      dateISO: act.created_at ?? undefined,
    });

    // ✅ Dynamic import so the native binary isn't bundled at build time
    const { Resvg } = await import("@resvg/resvg-js");

    // Render to PNG buffer
    const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1600 } });
    const png = resvg.render().asPng();

    // Upload to the certificates bucket
    const path = `${act.id}/certificate-${Date.now()}.png`;
    const { error: upErr } = await supabaseService.storage
      .from("certificates")
      .upload(path, png, {
        contentType: "image/png",
        upsert: true,
      });

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 400 });
    }

    // Public URL
    const { data: pub } = supabaseService.storage.from("certificates").getPublicUrl(path);
    const url = pub?.publicUrl || null;

    // Save back to the act
    const { error: updErr } = await supabaseService
      .from("good_acts")
      .update({ certificate_url: url })
      .eq("id", act.id);

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
