import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stories as mock } from "@/lib/mock";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "Disabled in production" }, { status: 403 });
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // …(reuse the same logic as in the script above)…

  return NextResponse.json({ ok: true });
}
