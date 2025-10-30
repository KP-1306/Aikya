// app/api/admin/cron/unlock/route.ts
import { NextResponse } from "next/server";
import { requireSupabaseService } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";
const JOB = "embeddings";

export async function POST() {
  try {
    await requireAdmin();
    const svc = requireSupabaseService();

    const { data, error } = await svc
      .from("cron_control")
      .select("*")
      .eq("job", JOB)
      .single();
    if (error) throw new Error(error.message);

    const now = new Date();
    const lockTs = data?.locked_until ? new Date(data.locked_until).getTime() : 0;

    // Only clear if no lock or lock expired
    if (!lockTs || lockTs < now.getTime()) {
      const { error: upd } = await svc
        .from("cron_control")
        .update({ locked_until: null })
        .eq("job", JOB);
      if (upd) throw new Error(upd.message);
      return NextResponse.json({ ok: true, cleared: true });
    }
    // Lock still valid → refuse
    return NextResponse.json({ ok: false, cleared: false, reason: "Lock still valid" }, { status: 409 });
  } catch (e: any) {
    const msg = e?.message ?? "Failed";
    const code = msg.includes("Not authorized") || msg.includes("Not authenticated") ? 403 : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}
