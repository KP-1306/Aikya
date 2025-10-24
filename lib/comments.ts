import { supabaseServer } from "@/lib/supabase/server";
import { supabase } from "@/lib/supabase/client"; // for types if needed

export type Comment = {
  id: number;
  story_id: string;
  author_id: string;
  body: string;
  is_approved: boolean;
  created_at: string;
  author?: { full_name: string | null };
};

export async function fetchCommentsForStory(storyId: string) {
  const sb = supabaseServer();
  // Readers will see only approved; authors see their own via RLS
  const { data, error } = await sb
    .from("comments")
    .select("id, story_id, author_id, body, is_approved, created_at, profiles:author_id(full_name)")
    .eq("story_id", storyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  // rename nested key
  return (data ?? []).map((c: any) => ({ ...c, author: { full_name: c.profiles?.full_name ?? null } })) as Comment[];
}

export async function isModerator() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return false;
  const { data } = await sb.from("moderators").select("user_id").eq("user_id", user.id).maybeSingle();
  return !!data;
}
