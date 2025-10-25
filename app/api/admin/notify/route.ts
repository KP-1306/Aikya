// Minimal webhook receiver; secure by a secret header
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret || req.headers.get("x-aikya-signature") !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await req.json().catch(() => null);
  // TODO: send email via Resend/Sendgrid/etc.
  // For now just acknowledge
  return NextResponse.json({ ok: true });
}
