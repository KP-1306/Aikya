// netlify/functions/embeddings-cron.ts
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

const JOB = "embeddings";
const DEFAULT_BATCH = Number(process.env.EMBEDDINGS_CRON_BATCH ?? 25);
const MIN_INTERVAL_MIN = Number(process.env.EMBEDDINGS_CRON_MIN_INTERVAL_MIN ?? 20);
const MAX_DAILY = Number(process.env.EMBEDDINGS_CRON_MAX_DAILY ?? 800);

const OPENAI_URL = "https://api.openai.com/v1/embeddings";
const OPENAI_MODEL = "text-embedding-3-small"; // 1536 dims

function norm(vec: number[]) {
  let n = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  if (!n || !Number.isFinite(n)) n = 1;
  return vec.map((v) => v / n);
}
function embedText(r: any) {
  return [r.title, r.dek, r.what, r.how, r.why].filter(Boolean).join("\n\n").slice(0, 8000);
}

async function embedBatch(texts: string[]) {
  if (!texts.length) return [];
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: OPENAI_MODEL, input: texts }),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { data?: Array<{ embedding: number[] }> };
  const out = (json.data ?? []).map((d) => norm(d.embedding));
  if (out.length !== texts.length) throw new Error("Embedding length mismatch");
  return out;
}

// Export a plain handler so we don't need @netlify/functions types
export async function handler() {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
      return {
        statusCode: 500,
        body: "Missing env: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / OPENAI_API_KEY",
      };
    }
    const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // ---- Lock & rate checks ----
    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    // Ensure control row exists
    await supa.from("cron_control").upsert([{ job: JOB, day: today }], { onConflict: "job" });

    // Fetch current control state
    const { data: ctrlRow, error: ctrlErr } = await supa
      .from("cron_control")
      .select("*")
      .eq("job", JOB)
      .single();
    if (ctrlErr) throw new Error(ctrlErr.message);

    // Daily window refresh
    let daily_count = ctrlRow.daily_count ?? 0;
    if (ctrlRow.day !== today) {
      const { error: upd } = await supa
        .from("cron_control")
        .update({ day: today, daily_count: 0 })
        .eq("job", JOB);
      if (upd) throw new Error(upd.message);
      daily_count = 0;
    }
    if (daily_count >= MAX_DAILY) {
      return { statusCode: 200, body: `Skipped: daily cap reached (${daily_count}/${MAX_DAILY}).` };
    }

    // Interval check
    if (ctrlRow.last_run) {
      const mins = (now.getTime() - new Date(ctrlRow.last_run).getTime()) / 60000;
      if (mins < MIN_INTERVAL_MIN) {
        return {
          statusCode: 200,
          body: `Skipped: ran ${mins.toFixed(1)}m ago; min ${MIN_INTERVAL_MIN}m.`,
        };
      }
    }

    // Acquire lock for 10 minutes
    const lockUntil = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
    const { error: lockErr } = await supa
      .from("cron_control")
      .update({ locked_until: lockUntil })
      .eq("job", JOB)
      .or(`locked_until.is.null,locked_until.lte.${now.toISOString()}`);
    if (lockErr) throw new Error(lockErr.message);

    // Re-read to confirm we hold lock
    const { data: checkLock } = await supa.from("cron_control").select("*").eq("job", JOB).single();
    if (
      checkLock.locked_until &&
      new Date(checkLock.locked_until).getTime() < now.getTime()
    ) {
      return { statusCode: 200, body: "Skipped: lock not acquired." };
    }

    // ---- Select rows needing embedding ----
    let rows: any[] = [];
    const view = await supa
      .from("stories_needing_embedding")
      .select("id, slug, title, dek, what, how, why, published_at")
      .order("published_at", { ascending: false })
      .limit(DEFAULT_BATCH);

    if (!view.error && view.data) {
      rows = view.data;
    } else {
      const fallback = await supa
        .from("stories")
        .select("id, slug, title, dek, what, how, why, published_at, embedding")
        .eq("is_published", true)
        .is("deleted_at", null)
        .is("embedding", null)
        .order("published_at", { ascending: false })
        .limit(DEFAULT_BATCH);
      if (fallback.error) throw new Error(fallback.error.message);
      rows = fallback.data ?? [];
    }

    if (rows.length === 0) {
      await supa
        .from("cron_control")
        .update({ last_run: now.toISOString(), locked_until: null })
        .eq("job", JOB);
      return { statusCode: 200, body: "Nothing to embed." };
    }

    // ---- Embed in chunks ----
    const texts = rows.map(embedText);
    const chunkSize = 96;
    const vectors: number[][] = [];
    for (let i = 0; i < texts.length; i += chunkSize) {
      const chunk = texts.slice(i, i + chunkSize);
      const vecs = await embedBatch(chunk);
      vectors.push(...vecs);
    }

    // ---- Persist (RPC if available; else upsert) ----
    let updated = 0;
    for (let i = 0; i < rows.length; i++) {
      const storyId = rows[i].id as string;
      const vec = vectors[i];

      const rpc = await supa.rpc("set_story_embedding", {
        p_id: storyId,
        p_embedding: vec as unknown as number[],
      });
      if (rpc.error && !/function set_story_embedding/i.test(rpc.error.message)) {
        throw new Error(rpc.error.message);
      }
      if (rpc.error) {
        const { error: up } = await supa
          .from("stories")
          .upsert(
            [
              {
                id: storyId,
                embedding: vec as unknown as any,
                embedding_updated_at: new Date().toISOString(),
              },
            ],
            { onConflict: "id", ignoreDuplicates: false }
          );
        if (up) throw new Error(up.message);
      }
      updated++;
    }

    // ---- Bump counters + release lock ----
    const { error: doneErr } = await supa
      .from("cron_control")
      .update({
        last_run: now.toISOString(),
        locked_until: null,
        day: today,
        daily_count: Math.min(MAX_DAILY, daily_count + updated),
      })
      .eq("job", JOB);
    if (doneErr) throw new Error(doneErr.message);

    return {
      statusCode: 200,
      body: JSON.stringify({
        updated,
        remainingToday: Math.max(0, MAX_DAILY - (daily_count + updated)),
      }),
      headers: { "content-type": "application/json" },
    };
  } catch (e: any) {
    return { statusCode: 500, body: String(e?.message ?? e) };
  }
}
