// app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
    "https://aikyanow.netlify.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // If you need to restrict areas later, uncomment and adjust:
        // disallow: ["/admin", "/api/private"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
