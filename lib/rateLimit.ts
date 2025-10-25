import { supabaseService } from "@/lib/supabase/service";

export async function rateLimit(key: string, max = 20, windowMs = 60_000) {
  const now = new Date();
  const winEnd = new Date(now.getTime() + windowMs).toISOString();

  const { data: row } = await supabaseService
    .from("rate_limits").select("*").eq("key", key).maybeSingle();

  if (!row || new Date(row.window_end) < now) {
    await supabaseService.from("rate_limits").upsert({ key, count: 1, window_end: winEnd });
    return true;
  }
  if (row.count >= max) return false;

  await supabaseService.from("rate_limits")
    .update({ count: row.count + 1 }).eq("key", key);
  return true;
}
