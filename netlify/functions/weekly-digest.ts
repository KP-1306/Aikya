// netlify/functions/weekly-digest.ts

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const RESEND_KEY = process.env.RESEND_API_KEY || "";

// Reuse client if the function container is warm
const sb = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// Export a plain handler – no @netlify/functions types needed
export const handler = async (_event: any, _context: any) => {
  try {
    if (!sb) {
      return { statusCode: 200, body: JSON.stringify({ ok: true, note: "Supabase not configured" }) };
    }

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: stories, error } = await sb
      .from("stories")
      .select("title, slug, dek, published_at")
      .eq("is_published", true)
      .gte("published_at", since)
      .order("published_at", { ascending: false })
      .limit(10);

    if (error) {
      return { statusCode: 200, body: JSON.stringify({ ok: false, error: error.message }) };
    }

    // Optional email via Resend – only if key exists.
    if (RESEND_KEY && stories && stories.length) {
      // @ts-ignore  (shim provided in types/shims-resend.d.ts when package is absent)
      const { Resend } = await import("resend");
      const resend = new Resend(RESEND_KEY);

      const html = `
        <h2>Aikya — Weekly highlights</h2>
        <ul>
          ${stories
            .map(
              (s) =>
                `<li><a href="https://aikyanow.netlify.app/story/${s.slug}">${s.title}</a></li>`
            )
            .join("")}
        </ul>
      `;

      // Uncomment & set recipients when you’re ready to actually send
      // await resend.emails.send({
      //   from: "Aikya <news@your-domain>",
      //   to: ["you@example.com"],
      //   subject: "Aikya — Weekly highlights",
      //   html,
      // });
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, count: stories?.length ?? 0 }) };
  } catch (e: any) {
    return { statusCode: 200, body: JSON.stringify({ ok: false, error: e?.message || "Unknown error" }) };
  }
};
