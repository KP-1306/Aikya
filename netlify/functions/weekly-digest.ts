// netlify/functions/weekly-digest.ts
import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend"; // or any email provider

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY!);

/** Runs weekly Monday 8am IST */
export const handler: Handler = async () => {
  try {
    // Get opted-in users with state
    const { data: users, error: uerr } = await supabase.from("profiles")
      .select("id, email, state")
      .eq("email_opt_in", true);
    if (uerr) throw uerr;

    // Get top 3 stories per user’s state (reuse RPC)
    for (const u of users ?? []) {
      const { data: recs } = await supabase.rpc("popular_stories_last_30d", { p_limit: 6 });
      const top = (recs ?? []).slice(0, 6);
      if (!u.email || top.length === 0) continue;

      await resend.emails.send({
        from: "Aikya <hello@aikya.news>",
        to: u.email,
        subject: `Good around ${u.state ?? "you"} · Weekly Aikya`,
        html: top.map(t =>
          `<p><a href="https://aikyanow.netlify.app/story/${t.slug}">${t.title}</a> — ${t.city ?? t.state ?? ""}</p>`
        ).join("") + `<hr/><p>Manage preferences in your Aikya account.</p>`
      });
    }
    return { statusCode: 200, body: "ok" };
  } catch (e: any) {
    console.error(e);
    return { statusCode: 500, body: e?.message ?? "error" };
  }
};
