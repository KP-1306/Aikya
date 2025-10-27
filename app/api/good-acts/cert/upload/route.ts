// app/api/good-acts/cert/upload/route.ts (example)
import { NextResponse } from "next/server";
import { requireSupabaseService } from "@/lib/supabase/service";

export async function POST(req: Request) {
  try {
    const { actId, fileBase64, contentType } = await req.json() as {
      actId: string;
      fileBase64: string;          // base64 data (no data: prefix), e.g. PNG/PDF
      contentType: string;         // "image/png" or "application/pdf"
    };
const supabaseService = requireSupabaseService();

    const bytes = Buffer.from(fileBase64, "base64");
    const path = `acts/${actId}${contentType === "application/pdf" ? ".pdf" : ".png"}`;

    const { error: upErr } = await supabaseService
      .storage
      .from("certificates")
      .upload(path, bytes, { contentType, upsert: true });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });

    const { data: pub } = supabaseService
      .storage
      .from("certificates")
      .getPublicUrl(path);

    // Save URL to good_acts.certificate_url (and optionally create a rewards row)
    const { error: updErr } = await supabaseService
      .from("good_acts")
      .update({ certificate_url: pub.publicUrl })
      .eq("id", actId);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

    return NextResponse.json({ ok: true, url: pub.publicUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
