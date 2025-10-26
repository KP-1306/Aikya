// lib/recs.ts
import { supabaseServer } from "@/lib/supabase/server";

export async function getRecommendations(opts: { userId?: string; state?: string; limit?: number } = {}) {
  const sb = supabaseServer();
  const limit = opts.limit ?? 6;

  // 1) Prefer user’s state
  let q = sb
    .from("stories")
    .select("id,slug,title,hero_image,city,state,is_published,published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (opts.state) q = q.eq("state", opts.state);

  const { data: primary } = await q;

  // 2) Fallback: globally popular last 30 days (by likes+saves+views)
  if ((primary?.length ?? 0) >= limit) return primary!;
  const { data: popular } = await sb.rpc("popular_stories_last_30d", { p_limit: limit }); // see SQL below

  // merge + unique by id
  const seen = new Set((primary ?? []).map(s => s.id));
  const merged = [...(primary ?? []), ...(popular ?? []).filter(s => !seen.has(s.id))].slice(0, limit);
  return merged;
}
