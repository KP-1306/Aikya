// app/sitemap.ts
import type { MetadataRoute } from "next";
import {
  requireSupabaseService,
  trySupabaseService,
} from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 60 * 60; // 1 hour

function getBase(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  return env || "https://aikyanow.netlify.app";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE = getBase();

  // Prefer a non-throwing client first; fall back to require*
  const svc = trySupabaseService() ?? requireSupabaseService();

  let stories:
    | Array<{ slug: string; updated_at?: string | null; published_at?: string | null }>
    | null = null;

  try {
    const { data, error } = await svc
      .from("stories")
      .select("slug, updated_at, published_at, deleted_at")
      .eq("is_published", true)
      .is("deleted_at", null)
      .order("published_at", { ascending: false })
      .limit(5000);

    if (!error) stories = data ?? [];
  } catch {
    // ignore; we'll fall back to static pages only
  }

  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/submit`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.1 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.1 },
  ];

  const storyPages: MetadataRoute.Sitemap =
    (stories ?? []).map((s) => ({
      url: `${BASE}/story/${s.slug}`,
      lastModified: s.updated_at
        ? new Date(s.updated_at)
        : s.published_at
        ? new Date(s.published_at)
        : now,
      changeFrequency: "weekly",
      priority: 0.6,
    })) || [];

  return [...staticPages, ...storyPages];
}
