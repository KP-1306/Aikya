// app/rss/route.ts
import { NextResponse } from "next/server";
import { trySupabaseService } from "@/lib/supabase/service";

// Build-time safe: do not prerender; always run on Node
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const BASE =
  process.env.NEXT_PUBLIC_BASE_URL || "https://aikyanow.netlify.app";

export async function GET() {
  const svc = trySupabaseService();

  // If the service key isn't available (e.g., at build time), return an empty but valid feed.
  if (!svc) {
    return xmlResponse(rss(""));
  }

  const { data } = await svc
    .from("stories")
    .select("slug, title, dek, published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(50);

  const items =
    (data ?? [])
      .map((s: any) => {
        const url = `${BASE}/story/${s.slug}`;
        const title = escapeXml(s.title ?? "");
        const desc = escapeXml(s.dek ?? "");
        const pub = new Date(s.published_at ?? Date.now()).toUTCString();
        return `
  <item>
    <title>${title}</title>
    <link>${url}</link>
    <guid>${url}</guid>
    <pubDate>${pub}</pubDate>
    <description>${desc}</description>
  </item>`;
      })
      .join("\n") || "";

  return xmlResponse(rss(items));
}

function rss(xmlItems: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Aikya — Good Around You</title>
  <link>${BASE}</link>
  <description>Local-first, uplifting stories with life lessons.</description>
${xmlItems}
</channel>
</rss>`;
}

function xmlResponse(xml: string) {
  return new NextResponse(xml, {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" } as const)[c]!
  );
}
