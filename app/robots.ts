// app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // Prefer configured site URL; fallback to your Netlify domain.
  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://aikyanow.netlify.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // If you ever need to hide areas from crawlers, add them here:
        // disallow: ["/admin", "/api/private"],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
