import { supabaseServer } from "@/lib/supabase/server";

export async function getReactions(storyId: string) {
  const sb = supabaseServer();

  // like count (public view)
  const { data: countRow } = await sb
    .from("story_like_counts")
    .select("likes")
    .eq("story_id", storyId)
    .maybeSingle();
  const likeCount = countRow?.likes ?? 0;

  // user
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { likeCount, liked: false, saved: false };

  // whether current user liked/saved
  const [{ data: likedRow }, { data: savedRow }] = await Promise.all([
    sb.from("likes").select("story_id").eq("story_id", storyId).eq("user_id", user.id).maybeSingle(),
    sb.from("saves").select("story_id").eq("story_id", storyId).eq("user_id", user.id).maybeSingle(),
  ]);

  return { likeCount, liked: !!likedRow, saved: !!savedRow };
}
