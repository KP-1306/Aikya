import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/service";

export const revalidate = 60;

export async function GET() {
  const base = "https://aikyanow.netlify.app";
  const updated = new Date().toISOString();

  const { data } = await supabaseService
    .from("stories")
    .select("slug, title, dek, published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(50);

  const entries = (data ?? []).map((s: any) => `
    <entry>
      <title>${escapeXml(s.title)}</title>
      <link href="${base}/story/${s.slug}"/>
      <id>${base}/story/${s.slug}</id>
      <updated>${new Date(s.published_at ?? Date.now()).toISOString()}</updated>
      <summary>${escapeXml(s.dek || "")}</summary>
    </entry>
  `).join("");

  const xml = `<?xml version="1.0" encoding="utf-8"?>
  <feed xmlns="http://www.w3.org/2005/Atom">
    <title>Aikya — Good Around You</title>
    <link href="${base}/atom"/>
    <updated>${updated}</updated>
    <id>${base}/</id>
    ${entries}
  </feed>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/atom+xml; charset=utf-8" },
  });
}

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) => ({ "<":"&lt;", ">":"&gt;", "&":"&amp;", "'":"&apos;", '"':"&quot;" }[c]!));
}
