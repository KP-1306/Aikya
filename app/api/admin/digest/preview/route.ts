// app/api/admin/digest/preview/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

function htmlShell(inner: string) {
  return new Response(inner, {
    headers: { "content-type": "text/html; charset=UTF-8" },
  });
}

function digestHtml(items: any[], site: string, range: string) {
  const rows = items
    .map(
      (s: any) => `
<li style="margin:0 0 16px 0">
  <a href="${site}/story/${s.slug}" style="font-weight:600;color:#0f172a;text-decoration:none">${s.title}</a>
  <div style="color:#334155;font-size:14px;line-height:1.4">${s.dek ?? ""}</div>
  <div style="color:#64748b;font-size:12px">${s.city ?? s.state ?? "—"}</div>
</li>`
    )
    .join("");

  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f8fafc">
  <h1 style="margin:0 0 6px 0;font-family:system-ui">Aikya · Weekly Digest</h1>
  <p style="margin:0 0 16px 0;color:#475569">Best uplifting stories · ${range}</p>
  <ul style="list-style:none;padding:0;margin:0">${rows}</ul>
</body></html>`;
}

async function isAdmin() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return false;
  const { data } = await sb.rpc("is_admin").single().catch(() => ({ data: null }));
  if (data === true) return true;
  const { data: prof } = await sb.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return prof?.role === "admin";
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
    "https://aikyanow.netlify.app";

  // mock last 7d preview via anon client is fine (published only)
  const sb = supabaseServer();
  const { data } = await sb
    .from("stories")
    .select("slug,title,dek,state,city,published_at,like_count")
    .eq("is_published", true)
    .is("deleted_at", null)
    .gte("published_at", new Date(Date.now() - 7 * 864e5).toISOString())
    .order("like_count", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(8);

  const items = data ?? [];
  const end = new Date();
  const start = new Date(Date.now() - 7 * 864e5);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
  const html = digestHtml(items, site, `${fmt(start)} – ${fmt(end)}`);

  return htmlShell(html);
}
