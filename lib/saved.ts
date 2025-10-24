// lib/saved.ts
import { supabaseServer } from "@/lib/supabase/server";

const STORY_COLUMNS =
  "id, slug, title, dek, city, state, country, read_minutes, published_at, hero_image";

export async function getSavedStories(page = 1, limit = 24) {
  const sb = supabaseServer();

  // who is signed in?
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Join saves -> stories (two queries: ids then details)
  const { data: saveRows, error: saveErr, count } = await sb
    .from("saves")
    .select("story_id", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (saveErr) throw new Error(saveErr.message);

  const storyIds = (saveRows ?? []).map((r) => r.story_id);
  if (storyIds.length === 0) return { items: [], total: count ?? 0 };

  const { data: stories, error: storyErr } = await sb
    .from("stories")
    .select(STORY_COLUMNS)
    .in("id", storyIds);

  if (storyErr) throw new Error(storyErr.message);

  // preserve the saved order (newest first)
  const order = new Map(storyIds.map((id, i) => [id, i]));
  const items = (stories ?? []).sort(
    (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
  );

  return { items, total: count ?? items.length };
}
