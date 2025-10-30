import { NextResponse } from "next/server";
export async function POST() {
  // Tell clients where to go now
  return NextResponse.json(
    { error: "Deprecated. Use /api/support/submit" },
    { status: 410 }
  );
}
