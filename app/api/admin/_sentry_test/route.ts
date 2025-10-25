import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const { data: { user } } = await supabaseServer().auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Only allow admins (simple check)
  // If you have an admins table:
  // const { data: admin } = await supabaseServer().from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  // if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    throw new Error("Aikya Sentry test error");
  } catch (e) {
    Sentry.captureException(e);
    await Sentry.close(2000);
    return NextResponse.json({ ok: true, sent: true });
  }
}
