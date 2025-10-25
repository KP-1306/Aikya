import { MetadataRoute } from "next";
import { supabaseService } from "@/lib/supabase/service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://aikyanow.netlify.app";

  // Core pages
  const items: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  // Stories (published only)
  const { data } = await supabaseService
    .from("stories")
    .select("slug, published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  (data ?? []).forEach((s: any) => {
    items.push({
      url: `${base}/story/${s.slug}`,
      lastModified: s.published_at ? new Date(s.published_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  });

  // TODO: Add city/state index pages if you want (query distinct city/state)

  return items;
}
