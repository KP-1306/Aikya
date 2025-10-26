// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // If no anon id cookie, set one (Edge-safe: use Web Crypto, not Node 'crypto')
  const hasAid = req.cookies.get("aid")?.value;
  if (!hasAid) {
    const anonId =
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    res.cookies.set("aid", anonId, {
      httpOnly: true,
      sameSite: "lax", // <- must be lowercase per type definition
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year (seconds)
    });
  }

  return res;
}

// Apply to all routes (adjust if you want to exclude static assets, etc.)
export const config = {
  matcher: "/:path*",
};
