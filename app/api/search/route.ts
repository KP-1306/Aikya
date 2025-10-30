// app/api/search/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const limit = Number(searchParams.get("limit") ?? 8);
  if (!q) return NextResponse.json({ data: [] });

  const qEmb = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: q,
  });
  const emb = `[` + qEmb.data[0].embedding.join(",") + `]`;

  const sb = createClient(url, anon);
  const { data, error } = await sb.rpc("semantic_search_stories", {
    query_embedding: emb as any, match_count: limit,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}
