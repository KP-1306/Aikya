// lib/comments.ts
import { supabaseServer } from "@/lib/supabase/server";

export type Comment = {
  id: number;
  story_id: string;
  author_id: string;
  body: string;
  is_approved: boolean;
  created_at: string;
  author?: { full_name: string | null; level?: string | null };
};

/**
 * Fetch comments for a story.
 * 1) Pull comments + author names (RLS will show only what the current viewer may see).
 * 2) (Best-effort) pull karma levels for those authors from a view/table if present.
 *    If the view isn't available yet, the level badge simply won't show.
 */
export async function fetchCommentsForStory(storyId: string) {
  const sb = supabaseServer();

  // 1) comments + author name (profiles)
  const { data, error } = await sb
    .from("comments")
    .select(
      "id, story_id, author_id, body, is_approved, created_at, profiles:author_id(full_name)"
    )
    .eq("story_id", storyId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows =
    (data ?? []).map((c: any) => ({
      id: c.id,
      story_id: c.story_id,
      author_id: c.author_id,
      body: c.body,
      is_approved: c.is_approved,
      created_at: c.created_at,
      author: { full_name: c.profiles?.full_name ?? null },
    })) as Comment[];

  // Collect unique author IDs
  const authorIds = Array.from(new Set(rows.map((r) => r.author_id))).filter(
    Boolean
  );

  if (authorIds.length === 0) return rows;

  // 2) Best-effort: fetch karma levels (view: karma_levels with columns user_id, level_label)
  // If the view isn't present yet, or the query fails, we just skip levels.
  try {
    const { data: levels } = await sb
      .from("karma_levels")
      .select("user_id, level_label")
      .in("user_id", authorIds as string[]);

    const levelByUser = new Map(
      (levels ?? []).map((r: any) => [r.user_id, r.level_label as string])
    );

    rows.forEach((r) => {
      const level = levelByUser.get(r.author_id) ?? null;
      if (level) {
        r.author = { ...(r.author ?? { full_name: null }), level };
      }
    });
  } catch {
    // If the view isn't created yet, do nothing.
  }

  return rows;
}

/**
 * True if current user is a moderator.
 */
export async function isModerator() {
  const sb = supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return false;
  const { data } = await sb
    .from("moderators")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  return !!data;
}
