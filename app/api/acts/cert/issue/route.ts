// app/api/acts/cert/issue/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { trySupabaseService } from "@/lib/supabase/service";
import { certificateSVG } from "@/lib/certificates/template";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Body = { actId?: string };

function toBytes(s: string) {
  return new TextEncoder().encode(s);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    if (!body.actId) {
      return NextResponse.json({ error: "Missing actId" }, { status: 400 });
    }

    // Auth + admin guard (cast once)
    const sb = supabaseServer();
    const sba = sb as any;

    const { data: userRes } = await sba.auth.getUser();
    const user = userRes?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: admin } = await sba
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!admin) return NextResponse.json({ error: "Admins only" }, { status: 403 });

    // Service client (bypasses RLS); cast once
    const svc = trySupabaseService();
    if (!svc) {
      return NextResponse.json(
        { error: "Server missing SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }
    const svca = svc as any;

    // Load act
    const { data: act, error: aErr } = await svca
      .from("good_acts")
      .select("id, person_name, created_at, certificate_url")
      .eq("id", body.actId)
      .single();

    if (aErr || !act) {
      return NextResponse.json({ error: "Act not found" }, { status: 404 });
    }

    // Build certificate (SVG only)
    const svg = certificateSVG({
      actId: act.id,
      personName: act.person_name ?? "Friend of Aikya",
      dateISO: act.created_at ?? undefined,
    });

    const bytes = toBytes(svg);
    const contentType = "image/svg+xml";
    const ext = "svg";
    const path = `${act.id}/certificate-${Date.now()}.${ext}`;

    // Upload to storage bucket `certificates`
    const { error: upErr } = await svca.storage
      .from("certificates")
      .upload(path, bytes, { contentType, upsert: true });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });

    // Public URL & persist back on the act
    const { data: pub } = svca.storage.from("certificates").getPublicUrl(path);
    const url = pub?.publicUrl ?? null;

    const { error: updErr } = await svca
      .from("good_acts")
      .update({ certificate_url: url })
      .eq("id", act.id);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

    return NextResponse.json({ ok: true, url, format: ext });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
