// app/api/admin/notify/route.ts
import { NextResponse } from "next/server";

function u8(s: string) {
  return new TextEncoder().encode(s);
}
function tsEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a[i] ^ b[i];
  return out === 0;
}

export async function POST(req: Request) {
  const secret = process.env.WEBHOOK_SECRET || "";
  const header = req.headers.get("x-aikya-signature") || "";

  if (!secret || !tsEqual(u8(secret), u8(header))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Optional: validate payload shape
  await req.json().catch(() => null);
  return NextResponse.json({ ok: true });
}
