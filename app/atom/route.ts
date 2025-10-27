// app/atom/route.ts
import { NextResponse } from "next/server";
import { trySupabaseService } from "@/lib/supabase/service";

// Build-time safe: always render dynamically on Node
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "https://aikyanow.netlify.app";

export async function GET() {
  const svc = trySupabaseService();
  const updated = new Date().toISOString();

  // If service client isn't available (e.g., missing key at build), return an empty but valid feed
  if (!svc) {
    return atomResponse(atomXml("", updated));
  }

  const { data } = await svc
    .from("stories")
    .select("slug, title, dek, published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(50);

  const entries =
    (data ?? [])
      .map((s: any) => {
        const url = `${BASE}/story/${s.slug}`;
        const title = escapeXml(s.title ?? "");
        const summary = escapeXml(s.dek ?? "");
        const upd = new Date(s.published_at ?? Date.now()).toISOString();
        return `
  <entry>
    <title>${title}</title>
    <link href="${url}"/>
    <id>${url}</id>
    <updated>${upd}</updated>
    <summary>${summary}</summary>
  </entry>`;
      })
      .join("\n") || "";

  return atomResponse(atomXml(entries, updated));
}

function atomXml(entries: string, updated: string) {
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Aikya — Good Around You</title>
  <link href="${BASE}/atom" rel="self"/>
  <link href="${BASE}"/>
  <id>${BASE}/</id>
  <updated>${updated}</updated>
${entries}
</feed>`;
}

function atomResponse(xml: string) {
  return new NextResponse(xml, {
    headers: { "content-type": "application/atom+xml; charset=utf-8" },
  });
}

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" } as const)[c]!
  );
}
