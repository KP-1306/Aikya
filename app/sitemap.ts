// app/sitemap.ts
import type { MetadataRoute } from "next";
import { trySupabaseService } from "@/lib/supabase/service";

const BASE = "https://aikyanow.netlify.app";

export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const svc = trySupabaseService();

  let slugs: { slug: string; updated_at?: string | null }[] = [];

  if (svc) {
    const { data } = await svc
      .from("stories")
      .select("slug, updated_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(500);
    slugs = data ?? [];
  }

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: new Date() },
    { url: `${BASE}/about`, lastModified: new Date() },
    { url: `${BASE}/submit`, lastModified: new Date() },
    { url: `${BASE}/privacy`, lastModified: new Date() },
    { url: `${BASE}/terms`, lastModified: new Date() },
  ];

  const storyPages: MetadataRoute.Sitemap =
    slugs.map((s) => ({
      url: `${BASE}/story/${s.slug}`,
      lastModified: s.updated_at ? new Date(s.updated_at) : new Date(),
    })) ?? [];

  return [...staticPages, ...storyPages];
}
