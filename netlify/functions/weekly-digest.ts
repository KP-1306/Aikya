// netlify/functions/weekly-digest.ts
// Schedules: run manually or via Netlify Scheduled Functions (UI).
// Safe: if RESEND_API_KEY (or provider) isn't set, it will no-op and exit 0.

import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
  "https://aikyanow.netlify.app";

// --- Email provider (dynamic / optional) ---
async function sendEmail(options: {
  to: string[];
  subject: string;
  html: string;
  from?: string;
}) {
  const from = options.from || "Aikya Weekly <no-reply@aikya.local>";
  const resendKey = process.env.RESEND_API_KEY;

  if (!resendKey) {
    console.log("[weekly-digest] RESEND_API_KEY not set — skipping send.");
    return { ok: true, skipped: true };
  }

  const { Resend } = await import("resend");
  const resend = new Resend(resendKey);
  await resend.emails.send({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
  return { ok: true, skipped: false };
}

// --- Supabase (service) ---
function svc() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Supabase env missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

// --- HTML template (simple, inline styles) ---
function digestHtml({
  weekRange,
  items,
}: {
  weekRange: string;
  items: Array<{
    slug: string;
    title: string;
    dek: string | null;
    state?: string | null;
    city?: string | null;
  }>;
}) {
  const list = items
    .map(
      (s) => `
<li style="margin:0 0 16px 0">
  <a href="${SITE}/story/${s.slug}" style="font-weight:600;color:#0f172a;text-decoration:none">${s.title}</a>
  <div style="color:#334155;font-size:14px;line-height:1.4">${s.dek ?? ""}</div>
  <div style="color:#64748b;font-size:12px">${s.city ?? s.state ?? "—"}</div>
</li>`
    )
    .join("");

  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px">
      <tr><td style="padding:24px">
        <h1 style="margin:0 0 6px 0;font-size:20px">Aikya · Weekly Digest</h1>
        <p style="margin:0 0 16px 0;color:#475569;font-size:14px">Best uplifting stories · ${weekRange}</p>
        <ul style="list-style:none;padding:0;margin:0">${list}</ul>
        <hr style="margin:20px 0;border:none;border-top:1px solid #e2e8f0" />
        <p style="margin:0;color:#94a3b8;font-size:12px">
          You’re receiving this because you’re on the Aikya team/testing list.
          <a href="${SITE}" style="color:#64748b">Visit Aikya</a>
        </p>
      </td></tr>
    </table>
  </body>
</html>`;
}

// --- Handler ---
export const handler: Handler = async () => {
  try {
    // Allow running with *only* service key set; email is optional.
    const supa = svc();

    // Top 8 published in the last 7 days, sorted by recent + light popularity
    const { data, error } = await supa
      .from("stories")
      .select("slug,title,dek,state,city,published_at,like_count")
      .eq("is_published", true)
      .is("deleted_at", null)
      .gte("published_at", new Date(Date.now() - 7 * 864e5).toISOString())
      .order("like_count", { ascending: false, nullsFirst: false })
      .order("published_at", { ascending: false })
      .limit(8);

    if (error) throw error;

    const items =
      (data ?? []).map((s) => ({
        slug: s.slug as string,
        title: s.title as string,
        dek: (s.dek as string) || null,
        state: (s.state as string) || null,
        city: (s.city as string) || null,
      })) || [];

    if (items.length === 0) {
      console.log("[weekly-digest] No recent items. Exiting.");
      return { statusCode: 200, body: "No items" };
    }

    // recipients: keep it simple — env var CSV
    const rawTo = process.env.DIGEST_TO || "";
    const to = rawTo
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    const end = new Date();
    const start = new Date(Date.now() - 7 * 864e5);
    const fmt = (d: Date) =>
      d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });

    const html = digestHtml({
      weekRange: `${fmt(start)} – ${fmt(end)}`,
      items,
    });

    if (to.length === 0) {
      console.log("[weekly-digest] DIGEST_TO not set — preview only.");
      return {
        statusCode: 200,
        headers: { "content-type": "text/html; charset=UTF-8" },
        body: html,
      };
    }

    const res = await sendEmail({
      to,
      subject: "Aikya · Weekly Digest",
      html,
      from: process.env.DIGEST_FROM || "Aikya Weekly <no-reply@aikya.local>",
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, skipped: !!res.skipped, count: items.length }),
    };
  } catch (e: any) {
    console.error("[weekly-digest] Error:", e?.message || e);
    return { statusCode: 500, body: e?.message || "Weekly digest failed" };
  }
};
