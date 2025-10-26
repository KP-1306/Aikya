// netlify/functions/weekly-digest.ts
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Use your public keys for read-only access, or switch to service role envs if you created them.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const RESEND_KEY = process.env.RESEND_API_KEY || "";

// Initialise clients once (Netlify may reuse the function container)
const sb = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

const resend = RESEND_KEY ? new Resend(RESEND_KEY) : null;

// Export a plain handler — no type import needed
export const handler = async (_event: any, _context: any) => {
  try {
    if (!sb) {
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true, note: "Supabase not configured" }),
      };
    }

    // Fetch the most recent published stories in the last 7 days
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: stories, error } = await sb
      .from("stories")
      .select("title, slug, dek, published_at")
      .eq("is_published", true)
      .gte("published_at", since)
      .order("published_at", { ascending: false })
      .limit(10);

    if (error) {
      // Still return 200 so the cron doesn’t fail the whole deploy
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: false, error: error.message }),
      };
    }

    // If you’ve configured RESEND_API_KEY, send a tiny digest (stub)
    if (resend && stories && stories.length) {
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

      // TODO: replace with your audience list / recipients
      // await resend.emails.send({
      //   from: "Aikya <news@your-domain>",
      //   to: ["you@example.com"],
      //   subject: "Aikya — Weekly highlights",
      //   html,
      // });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, count: stories?.length ?? 0 }),
    };
  } catch (e: any) {
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: false, error: e?.message || "Unknown error" }),
    };
  }
};
