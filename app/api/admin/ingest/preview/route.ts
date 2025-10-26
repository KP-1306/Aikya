// app/api/admin/ingest/preview/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import OpenAI from "openai";

// Run as a Netlify/Node function (NOT Edge)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Create a client only if the key is present
const openai =
  process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function POST(req: Request) {
  try {
    const { url } = (await req.json()) as { url?: string };
    if (!url) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    // Auth + admin check
    const sb = supabaseServer();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: admin } = await sb
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Fetch the page
    const res = await fetch(url, {
      headers: {
        "user-agent": "AikyaBot/1.0 (+https://aikyanow.netlify.app)",
      },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const html = await res.text();

    // Dynamically import server-only libs (avoids bundling for Edge)
    const { JSDOM } = await import("jsdom");
    const { Readability } = await import("@mozilla/readability");

    // Extract main article content
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    const text = article?.textContent?.trim() || "";

    if (!text || text.length < 200) {
      return NextResponse.json(
        { error: "Could not extract enough text from page." },
        { status: 400 }
      );
    }

    // Build the draft (LLM when available; fallback otherwise)
    let draft: any;

    if (openai) {
      const system = `You are a factual editor for a positivity-first news site.
Return STRICT JSON with keys: title, dek, what, how, why, life_lesson, category, city, state, country, read_minutes, sources.
- Keep neutral, uplifting tone.
- Ensure content is safe for 12+ audience.
- Prefer Indian locations when clear; else leave null.
- sources must be an array of {name,url}, include the original URL as first item.`;

      const userPrompt = `ORIGINAL URL: ${url}
ARTICLE TEXT:
"""${text.slice(0, 15000)}"""`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      });

      const raw = completion.choices[0].message.content || "{}";
      const parsed = JSON.parse(raw);

      draft = {
        title: parsed.title || article?.title || "",
        dek: parsed.dek || "",
        what: parsed.what || "",
        how: parsed.how || "",
        why: parsed.why || "",
        life_lesson: parsed.life_lesson || "",
        category: parsed.category || "ActsOfKindness",
        city: parsed.city || null,
        state: parsed.state || null,
        country: parsed.country || "IN",
        read_minutes: parsed.read_minutes ?? Math.max(2, Math.round(text.split(/\s+/).length / 200)),
        hero_image: null,
        hero_alt: null,
        hero_credit: null,
        sources:
          Array.isArray(parsed.sources) && parsed.sources.length
            ? parsed.sources
            : [{ name: article?.siteName || new URL(url).hostname, url }],
      };
    } else {
      // Fallback without LLM: simple heuristic summary
      const paras = text.split(/\n+/).filter(Boolean);
      const first = paras[0] || "";

      draft = {
        title: article?.title || first.slice(0, 80),
        dek: paras.slice(1, 3).join(" ").slice(0, 200),
        what: paras.slice(0, 3).join(" ").slice(0, 400),
        how: paras.slice(3, 6).join(" ").slice(0, 400),
        why: paras.slice(6, 9).join(" ").slice(0, 400),
        life_lesson: "Small acts can create outsized hope.",
        category: "ActsOfKindness",
        city: null,
        state: null,
        country: "IN",
        read_minutes: Math.max(2, Math.round(text.split(/\s+/).length / 200)),
        hero_image: null,
        hero_alt: null,
        hero_credit: null,
        sources: [{ name: article?.siteName || new URL(url).hostname, url }],
      };
    }

    return NextResponse.json({ draft });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
