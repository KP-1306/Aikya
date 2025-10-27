// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Hard skip for routes that must not be touched by this middleware
  if (
    pathname.startsWith("/auth/callback") || // Supabase exchange
    pathname.startsWith("/signin") ||        // sign-in page
    pathname.startsWith("/signup") ||        // sign-up page
    pathname.startsWith("/api") ||           // APIs
    pathname.startsWith("/_next") ||         // Next internals
    pathname.startsWith("/favicon.ico") ||   // assets
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml")
  ) {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  // Set anonymous id cookie only if missing
  if (!req.cookies.get("aid")?.value) {
    const anonId =
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    res.cookies.set("aid", anonId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  return res;
}

// Only run on pages that need the anon cookie; avoid everything else
export const config = {
  matcher: [
    "/",                // home/feed
    "/story/:path*",    // story pages
    "/account/:path*",  // account (if you want)
    // add others if needed, but DO NOT include /auth/callback here
  ],
};
