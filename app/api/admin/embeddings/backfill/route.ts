// app/api/admin/embeddings/backfill/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSupabaseService } from "@/lib/supabase/service";

export const runtime = "nodejs";

type StoryRow = {
  id: string;
  slug?: string | null;
  title?: string | null;
  dek?: string | null;
  what?: string | null;
  how?: string | null;
  why?: string | null;
  published_at?: string | null;
};

const OPENAI_URL = "https://api.openai.com/v1/embeddings";
const OPENAI_MODEL = "text-embedding-3-small"; // 1536 dims

// ---------- helpers ----------
function isString(x: unknown): x is string {
  return typeof x === "string" && x.length > 0;
}

function normalize(vec: number[]): number[] {
  let norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  if (!norm || !Number.isFinite(norm)) norm = 1;
  return vec.map((v) => v / norm);
}

function buildEmbedText(r: StoryRow): string {
  const parts = [r.title, r.dek, r.what, r.how, r.why].filter(Boolean) as string[];
  return parts.join("\n\n").slice(0, 8000);
}

async function isAdmin(): Promise<boolean> {
  const sb = supabaseServer();
  const sba = sb as any; // ← cast once to dodge Netlify TS union issue

  const { data: userRes } = await sba.auth.getUser();
  const user = userRes?.user;
  if (!user) return false;

  // 1) preferred: admins table
  const { data: admin } = await sba
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (admin) return true;

  // 2) fallback: profiles.role
  const { data: prof } = await sba
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (prof?.role === "admin") return true;

  // 3) optional RPC
  try {
    const { data } = await sba.rpc("is_admin").single();
    if (data === true) return true;
  } catch {
    /* ignore */
  }

  return false;
}

async function embedBatch(texts: string[], apiKey: string): Promise<number[][]> {
  if (texts.length === 0) return [];
  const resp = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: texts,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`OpenAI embeddings failed (${resp.status}): ${errText}`);
  }

  const json = (await resp.json()) as { data?: Array<{ embedding: number[] }> };
  const out = (json.data ?? []).map((d) => normalize(d.embedding));
  if (out.length !== texts.length) {
    throw new Error("Embedding response length mismatch");
  }
  return out;
}

/** Try your RPC; if not present, fall back to a direct upsert. */
async function persistVector(
  svc: ReturnType<typeof requireSupabaseService>,
  storyId: string,
  vector: number[]
): Promise<void> {
  const svca = svc as any; // ← cast once

  // First try RPC: set_story_embedding(p_id uuid, p_embedding float8[])
  try {
    const { error } = await svca.rpc("set_story_embedding", {
      p_id: storyId,
      p_embedding: vector as unknown as number[],
    });
    if (!error) return;
    throw new Error(error.message);
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    const unknownFunction =
      msg.includes("function set_story_embedding") ||
      msg.includes("does not exist") ||
      msg.includes("42883");

    if (!unknownFunction) throw e;

    // Fallback upsert
    const now = new Date().toISOString();
    const { error: upErr } = await svca
      .from("stories")
      .upsert(
        [
          {
            id: storyId,
            embedding: vector as unknown as any,
            embedding_updated_at: now,
          },
        ],
        { onConflict: "id", ignoreDuplicates: false }
      );
    if (upErr) throw new Error(upErr.message);
  }
}

async function selectBatch(
  svc: ReturnType<typeof requireSupabaseService>,
  limit: number
): Promise<StoryRow[]> {
  const svca = svc as any; // ← cast once

  // Prefer helper view if present
  const { data: viewRows, error: viewErr } = await svca
    .from("stories_needing_embedding")
    .select("id, slug, title, dek, what, how, why, published_at")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (!viewErr && Array.isArray(viewRows)) return viewRows as StoryRow[];

  // Fallback: published + no embedding + not deleted
  const { data: fallback, error: selErr } = await svca
    .from("stories")
    .select("id, slug, title, dek, what, how, why, published_at, embedding")
    .eq("is_published", true)
    .is("deleted_at", null)
    .is("embedding", null)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (selErr) throw new Error(selErr.message);
  return (fallback ?? []) as StoryRow[];
}

// ---------- handler ----------
export async function POST(req: Request) {
  try {
    // AuthZ
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Config
    const key = process.env.OPENAI_API_KEY;
    if (!isString(key)) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Inputs
    const url = new URL(req.url);
    const qpLimit = url.searchParams.get("limit");
    const qpDry = url.searchParams.get("dryRun");
    const body = (await req.json().catch(() => ({}))) as {
      limit?: number;
      dryRun?: boolean;
    };

    const limit = Math.min(
      100,
      Math.max(1, Number.isFinite(Number(qpLimit)) ? Number(qpLimit) : body.limit ?? 25)
    );
    const dryRun =
      (qpDry ? qpDry === "true" : body.dryRun ?? false) === true ? true : false;

    const svc = requireSupabaseService();

    // Select batch
    const rows = await selectBatch(svc, limit);
    if (rows.length === 0) {
      return NextResponse.json({ updated: 0, dryRun, items: [] });
    }

    // Embed (chunked)
    const texts = rows.map(buildEmbedText);
    const chunkSize = 96;
    const vectors: number[][] = [];
    for (let i = 0; i < texts.length; i += chunkSize) {
      const chunk = texts.slice(i, i + chunkSize);
      const vecs = await embedBatch(chunk, key);
      vectors.push(...vecs);
    }

    // Persist (unless dry run)
    let updated = 0;
    if (!dryRun) {
      for (let i = 0; i < rows.length; i++) {
        await persistVector(svc, rows[i].id, vectors[i]);
        updated++;
      }
    }

    return NextResponse.json({
      updated,
      dryRun,
      items: rows.map((r) => ({ id: r.id, slug: r.slug ?? null })),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Backfill failed" },
      { status: 500 }
    );
  }
}
