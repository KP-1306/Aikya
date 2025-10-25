import { NextResponse, NextRequest } from "next/server";
import { randomUUID } from "crypto";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const hasAid = req.cookies.get("aid")?.value;
  if (!hasAid) {
    res.cookies.set("aid", randomUUID(), {
      httpOnly: true,
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365 // 1 year
    });
  }
  return res;
}
