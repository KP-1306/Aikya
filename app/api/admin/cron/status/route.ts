// app/api/admin/cron/status/route.ts
import { NextResponse } from "next/server";
import { requireSupabaseService } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";

const JOB = "embeddings";

export async function GET() {
  try {
    await requireAdmin();
    const svc = requireSupabaseService();

    // Ensure row exists (idempotent)
    const today = new Date().toISOString().slice(0, 10);
    await svc.from("cron_control").upsert([{ job: JOB, day: today }], { onConflict: "job" });

    const { data, error } = await svc.from("cron_control").select("*").eq("job", JOB).single();
    if (error) throw new Error(error.message);

    const minInterval = Number(process.env.EMBEDDINGS_CRON_MIN_INTERVAL_MIN ?? 20);
    const lastRunTs = data?.last_run ? new Date(data.last_run).getTime() : 0;
    const nextDue =
      lastRunTs > 0 ? new Date(lastRunTs + minInterval * 60 * 1000).toISOString() : null;

    const maxDaily = Number(process.env.EMBEDDINGS_CRON_MAX_DAILY ?? 800);
    const remaining = Math.max(0, maxDaily - (data?.daily_count ?? 0));

    return NextResponse.json({
      job: JOB,
      last_run: data?.last_run ?? null,
      locked_until: data?.locked_until ?? null,
      day: data?.day ?? null,
      daily_count: data?.daily_count ?? 0,
      min_interval_min: minInterval,
      next_due: nextDue,
      max_daily: maxDaily,
      remaining_today: remaining,
    });
  } catch (e: any) {
    const msg = e?.message ?? "Failed";
    const code = msg.includes("Not authorized") || msg.includes("Not authenticated") ? 403 : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}
