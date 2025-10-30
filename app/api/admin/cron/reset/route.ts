// app/api/admin/cron/reset/route.ts
import { NextResponse } from "next/server";
import { requireSupabaseService } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";
const JOB = "embeddings";

export async function POST() {
  try {
    await requireAdmin();
    const svc = requireSupabaseService();

    const today = new Date().toISOString().slice(0, 10);
    // Reset daily_count; keep last_run as-is
    const { error } = await svc
      .from("cron_control")
      .upsert([{ job: JOB, day: today, daily_count: 0 }], { onConflict: "job" });
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = e?.message ?? "Failed";
    const code = msg.includes("Not authorized") || msg.includes("Not authenticated") ? 403 : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}
