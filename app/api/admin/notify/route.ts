// app/api/admin/notify/route.ts
import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// constant-time compare for shared-secret header
function safeEqual(a: string, b: string) {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  if (A.length !== B.length) return false;
  return timingSafeEqual(A, B);
}

export async function POST(req: Request) {
  const secret = process.env.WEBHOOK_SECRET ?? "";
  const sig = req.headers.get("x-aikya-signature") ?? "";

  if (!secret || !safeEqual(sig, secret)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // best-effort parse (don’t throw)
  let payload: unknown = null;
  try {
    payload = await req.json();
  } catch {
    payload = null;
  }

  // TODO: send email via Resend/Sendgrid/etc.
  return NextResponse.json({ ok: true });
}
