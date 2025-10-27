// app/sitemap.xml/route.ts
import { NextResponse } from "next/server";
import { trySupabaseService } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

function xml(urlset: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>`;
}

export async function GET() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://example.com";
  const staticUrls = [
    "/", "/about", "/privacy", "/terms", "/search", "/support", "/submit",
  ];

  const svc = trySupabaseService();

  let storyUrls: string[] = [];
  if (svc) {
    const { data: stories } = await svc
      .from("stories")
      .select("slug, updated_at")
      .eq("is_published", true)
      .order("updated_at", { ascending: false })
      .limit(1000);

    storyUrls =
      stories?.map((s) => {
        const loc = `${base}/story/${s.slug}`;
        const lastmod = s.updated_at ?? new Date().toISOString();
        return `<url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`;
      }) ?? [];
  }

  const staticXml = staticUrls
    .map((p) => `<url><loc>${base}${p}</loc></url>`)
    .join("\n");

  const body = xml([staticXml, ...storyUrls].join("\n"));

  return new NextResponse(body, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
