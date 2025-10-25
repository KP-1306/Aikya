import { NextResponse, NextRequest } from "next/server";
import { randomUUID } from "crypto";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const AID_NAME = "aid";
  if (!req.cookies.has(AID_NAME)) {
    res.cookies.set(AID_NAME, randomUUID(), {
      httpOnly: false,
      sameSite: "Lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return res;
}

// If you want to limit where it runs, you can add:
// export const config = { matcher: ["/((?!_next|api/health|favicon.ico).*)"] };
