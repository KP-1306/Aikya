// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Hard-skip inside middleware (defense-in-depth; matcher already avoids these)
  if (
    pathname.startsWith("/auth/callback") || // Supabase exchange
    pathname.startsWith("/signin") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  // Set anonymous id cookie only if missing (Edge-safe web crypto)
  if (!req.cookies.get("aid")?.value) {
    const anonId =
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Use object form; note sameSite must be lowercase 'lax' for types
    res.cookies.set({
      name: "aid",
      value: anonId,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  return res;
}

// Only run where we need the anon cookie; DO NOT include auth/api/_next here.
export const config = {
  matcher: [
    "/",               // home / feed
    "/story/:path*",   // story pages
    "/account/:path*", // account
    "/coach/:path*",   // karma coach
  ],
};
