import { supabaseServer } from "./supabase/server";

export async function getStories(opts: { state?: string; category?: string; limit?: number } = {}) {
  const sb = supabaseServer();
  let q = sb.from("stories").select("*").eq("is_published", true).order("published_at", { ascending: false });
  if (opts.state) q = q.eq("state", opts.state);
  if (opts.category) q = q.eq("category", opts.category);
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function getStoryBySlug(slug: string) {
  const sb = supabaseServer();
  const { data, error } = await sb.from("stories").select("*").eq("slug", slug).eq("is_published", true).single();
  if (error) throw error;
  const { data: sources } = await sb.from("sources").select("name, url").eq("story_id", data.id);
  return { ...data, sources: sources ?? [] };
}
