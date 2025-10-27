// app/sitemap.xml/route.ts
import { NextResponse } from "next/server";
import { trySupabaseService } from "@/lib/supabase/service";

// Make sure Next NEVER prerenders this at build time
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "https://aikyanow.netlify.app";

// A few static pages you want indexed even if DB access fails
const STATIC_PATHS = [
  "/", "/about", "/search", "/submit",
  "/privacy", "/terms", "/support", "/support/new",
];

export async function GET() {
  // Try service client; if missing at build, we still return a valid sitemap
  const svc = trySupabaseService();

  // Always include static pages
  const urls: string[] = STATIC_PATHS.map((p) => `${BASE}${p}`);

  if (svc) {
    // Best-effort: add published stories
    const { data } = await svc
      .from("stories")
      .select("slug, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(2000);

    for (const row of data ?? []) {
      urls.push(`${BASE}/story/${row.slug}`);
    }
  }

  const now = new Date().toISOString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => urlXml(u, now)).join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}

function urlXml(loc: string, lastmodISO: string) {
  // Keep it simple; search engines ignore unsupported fields gracefully
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmodISO}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${loc === `${BASE}/` ? "0.9" : "0.6"}</priority>
  </url>`;
}

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" } as const)[c]!
  );
}
