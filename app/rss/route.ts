import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/service";

export const revalidate = 60; // rebuild every minute

export async function GET() {
  const base = "https://aikyanow.netlify.app";
  const { data } = await supabaseService
    .from("stories")
    .select("slug, title, dek, published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(50);

  const items = (data ?? []).map((s: any) => `
    <item>
      <title>${escapeXml(s.title)}</title>
      <link>${base}/story/${s.slug}</link>
      <guid>${base}/story/${s.slug}</guid>
      <pubDate>${new Date(s.published_at ?? Date.now()).toUTCString()}</pubDate>
      <description>${escapeXml(s.dek || "")}</description>
    </item>
  `).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title>Aikya — Good Around You</title>
      <link>${base}</link>
      <description>Local-first, uplifting stories with life lessons.</description>
      ${items}
    </channel>
  </rss>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) => ({ "<":"&lt;", ">":"&gt;", "&":"&amp;", "'":"&apos;", '"':"&quot;" }[c]!));
}
