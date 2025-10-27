import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSupabaseService } from "@/lib/supabase/service";

import { embedText } from "@/lib/embeddings";

type Body = { quote: string; state?: string; limit?: number };

export async function POST(req: Request) {
  try {
    const { quote, state, limit = 10 } = await req.json() as Body;
    if (!quote || quote.trim().length < 4) {
      return NextResponse.json({ error: "Please enter a longer quote." }, { status: 400 });
    }

    const supabaseService = requireSupabaseService();

    const qvec = await embedText(quote);
    const { data, error } = await supabaseService.rpc("quote_search", {
      qvec, k: limit, ustate: state || null
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ results: data || [] });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
