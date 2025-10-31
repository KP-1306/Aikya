import { requireSupabaseService } from "@/lib/supabase/service";

export type StoryListArgs = {
  q?: string;
  city?: string | null;
  state?: string | null;
  limit?: number;
  offset?: number;
  scope?: "all" | "city" | "state";
};

export async function listStories({
  q,
  city,
  state,
  limit = 24,
  offset = 0,
  scope = "all",
}: StoryListArgs) {
  const svc = requireSupabaseService();
  let sel = svc
    .from("stories")
    .select("id,slug,title,dek,hero_image,city,state,country,read_minutes,published_at")
    .eq("is_published", true)
    .is("deleted_at", null);

  if (q?.trim()) {
    // text fallback – we can later swap to embeddings
    sel = sel.ilike("title", `%${q}%`);
  }

  // ONLY apply location filter if scope demands it
  if (scope === "city" && city) sel = sel.eq("city", city);
  if (scope === "state" && state) sel = sel.eq("state", state);

  sel = sel.order("published_at", { ascending: false, nullsFirst: false })
           .range(offset, offset + limit - 1);

  const { data, error } = await sel;
  if (error) throw new Error(error.message);
  return data ?? [];
}
