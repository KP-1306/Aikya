// netlify/functions/weekly-digest.ts
// Safe weekly digest function.
// - No compile-time dependency on @netlify/functions
// - Optional email via Resend (dynamic import; won't break builds if not installed)

import { createClient } from "@supabase/supabase-js";

const SITE =
  (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "") ||
  "https://aikyanow.netlify.app";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Optional email (will no-op if not configured)
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const RESEND_FROM = process.env.RESEND_FROM || ""; // e.g. "Aikya <noreply@aikya.app>"
const RESEND_TO = process.env.RESEND_TO || "";     // comma-separated list

function htmlShell(inner: string) {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f8fafc">${inner}</body></html>`;
}

function digestHtml(items: any[], range: string) {
  const rows = items
    .map(
      (s: any) => `
<li style="margin:0 0 16px 0">
  <a href="${SITE}/story/${s.slug}" style="font-weight:600;color:#0f172a;text-decoration:none">${s.title}</a>
  <div style="color:#334155;font-size:14px;line-height:1.4">${s.dek ?? ""}</div>
  <div style="color:#64748b;font-size:12px">${s.city ?? s.state ?? "—"}</div>
</li>`
    )
    .join("");

  return htmlShell(`
  <h1 style="margin:0 0 6px 0;font-family:system-ui">Aikya · Weekly Digest</h1>
  <p style="margin:0 0 16px 0;color:#475569">Best uplifting stories · ${range}</p>
  <ul style="list-style:none;padding:0;margin:0">${rows}</ul>
  `);
}

export async function handler() {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return {
        statusCode: 200,
        body:
          "Weekly digest: skipped (missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).",
      };
    }

    const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Fetch last 7 days, top by likes then recency
    const since = new Date(Date.now() - 7 * 864e5).toISOString();
    const { data, error } = await supa
      .from("stories")
      .select("slug,title,dek,state,city,published_at,like_count")
      .eq("is_published", true)
      .is("deleted_at", null)
      .gte("published_at", since)
      .order("like_count", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(10);

    if (error) {
      return { statusCode: 500, body: `DB error: ${error.message}` };
    }

    const items = data ?? [];
    const end = new Date();
    const start = new Date(Date.now() - 7 * 864e5);
    const fmt = (d: Date) =>
      d.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });

    const html = digestHtml(items, `${fmt(start)} – ${fmt(end)}`);

    // If mail provider not set, just return preview (no-op success)
    if (!RESEND_API_KEY || !RESEND_FROM || !RESEND_TO) {
      return {
        statusCode: 200,
        headers: { "content-type": "text/html; charset=UTF-8" },
        body: html,
      };
    }

    // Optional: send via Resend if available (dynamic import avoids build-time dep)
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Resend } = await import("resend").catch(() => ({ Resend: null as any }));
      if (!Resend) {
        return {
          statusCode: 200,
          headers: { "content-type": "text/html; charset=UTF-8" },
          body: `<!-- resend not installed; rendering preview -->\n${html}`,
        };
      }

      const resend = new Resend(RESEND_API_KEY);
      const to = RESEND_TO.split(",").map((s) => s.trim()).filter(Boolean);

      await resend.emails.send({
        from: RESEND_FROM,
        to,
        subject: `Aikya · Weekly Digest (${fmt(start)} – ${fmt(end)})`,
        html,
      });

      return {
        statusCode: 200,
        body: `Sent weekly digest to ${to.length} recipient(s).`,
      };
    } catch (e: any) {
      // Fall back to preview if send fails
      return {
        statusCode: 200,
        headers: { "content-type": "text/html; charset=UTF-8" },
        body: `<!-- send failed: ${String(e?.message || e)} -->\n${html}`,
      };
    }
  } catch (e: any) {
    return { statusCode: 500, body: String(e?.message ?? e) };
  }
}
