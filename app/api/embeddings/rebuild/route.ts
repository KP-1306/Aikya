// app/api/embeddings/rebuild/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE!;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST() {
  const sb = createClient(url, serviceKey, { auth: { persistSession: false }});

  // Pull latest published stories (id + concatenated text)
  const { data: stories, error } = await sb
    .from("stories")
    .select("id,title,dek,what,how,why,sources")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(200); // adjust

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  for (const s of stories ?? []) {
    const text =
      [s.title, s.dek, s.what, s.how, s.why, JSON.stringify(s.sources ?? {})]
        .filter(Boolean)
        .join("\n");

    const emb = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text.slice(0, 8000), // safety
    });

    const vec = emb.data[0].embedding;

    await sb
      .from("stories_embeddings")
      .upsert({ story_id: s.id, embedding: `[` + vec.join(",") + `]` as any });
  }

  return NextResponse.json({ ok: true, count: stories?.length ?? 0 });
}
