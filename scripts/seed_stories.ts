// scripts/seed_stories.ts
// Usage:
//   SITE_URL=https://aikyanow.netlify.app \
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//   pnpm tsx scripts/seed_stories.ts --file seed/stories.json --publish --certs=2 --rebuild-embeddings
//
// Flags:
//   --file=path/to/json   (default: seed/stories.json)
//   --limit=N             (optional; seed first N only)
//   --publish             (force is_published=true + published_at=now when missing)
//   --certs=N             (create N sample good_acts and mint certificates)
//   --rebuild-embeddings  (calls your embeddings rebuild endpoint if present)

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

type StoryRow = {
  slug: string;
  title: string;
  dek?: string;
  what?: string;
  how?: string;
  why?: string;
  life_lesson?: string;
  city?: string;
  state?: string;
  country?: string;
  hero_image?: string;
  read_minutes?: number;
  sources?: unknown;
  is_published?: boolean;
  published_at?: string;
};

function getFlag(name: string): string | undefined {
  const arg = process.argv.find(a => a.startsWith(`--${name}`));
  if (!arg) return undefined;
  const [_, v] = arg.split("=");
  return v ?? "true";
}

function boolFlag(name: string): boolean {
  const v = getFlag(name);
  if (!v) return false;
  return ["1", "true", "yes"].includes(v.toLowerCase());
}

function intFlag(name: string): number | undefined {
  const v = getFlag(name);
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
}

function envOrThrow(k: string): string {
  const v = process.env[k];
  if (!v) throw new Error(`Missing env ${k}`);
  return v;
}

function siteOrigin(): string {
  const env = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/+$/, "");
  return "http://localhost:3000";
}

async function readJSON<T>(p: string): Promise<T> {
  const data = await fs.readFile(p, "utf8");
  return JSON.parse(data) as T;
}

function nowISO() {
  return new Date().toISOString();
}

async function main() {
  const SUPABASE_URL = envOrThrow("SUPABASE_URL");
  const SERVICE_KEY = envOrThrow("SUPABASE_SERVICE_ROLE_KEY");

  const file = getFlag("file") || "seed/stories.json";
  const limit = intFlag("limit");
  const forcePublish = boolFlag("publish");
  const certCount = intFlag("certs") ?? 0;
  const rebuildEmbeddings = boolFlag("rebuild-embeddings");

  const client = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const cwd = path.dirname(fileURLToPath(import.meta.url));
  const abs = path.isAbsolute(file) ? file : path.join(process.cwd(), file);

  console.log(`→ Reading ${abs}`);
  const all = await readJSON<StoryRow[]>(abs);
  const rows = typeof limit === "number" ? all.slice(0, limit) : all;

  let upserts = 0;
  for (const s of rows) {
    if (!s.slug || !s.title) {
      console.warn(`! skipping invalid row (needs slug & title):`, s);
      continue;
    }

    const update: any = { ...s };

    // Coerce sources to JSON if string
    if (typeof update.sources === "string") {
      try {
        update.sources = JSON.parse(update.sources);
      } catch {
        console.warn(`! ignoring invalid sources JSON for slug=${s.slug}`);
        delete update.sources;
      }
    }

    if (forcePublish) {
      update.is_published = true;
      if (!update.published_at) update.published_at = nowISO();
    } else if (update.is_published && !update.published_at) {
      update.published_at = nowISO();
    }

    // Upsert by slug using unique index
    const { error } = await client
      .from("stories")
      .upsert(update, { onConflict: "slug" });

    if (error) {
      console.error(`✗ upsert failed for slug=${s.slug}:`, error.message);
      continue;
    }
    upserts++;
    console.log(`✓ upserted: ${s.slug}`);
  }
  console.log(`→ Done upserts: ${upserts}/${rows.length}`);

  // Optional: rebuild embeddings after seeding (if you have an API for it)
  if (rebuildEmbeddings) {
    try {
      const res = await fetch(`${siteOrigin()}/api/embeddings/rebuild`, { method: "POST" });
      if (res.ok) console.log("✓ embeddings rebuild triggered");
      else console.warn("! embeddings rebuild endpoint responded non-200");
    } catch (e) {
      console.warn("! embeddings rebuild call failed:", (e as Error).message);
    }
  }

  // Optional: mint a few sample acts + certificates
  if (certCount > 0) {
    console.log(`→ Creating ${certCount} sample good_acts + certificates`);
    for (let i = 0; i < certCount; i++) {
      // Pick a random published story to anchor the act
      const { data: story } = await client
        .from("stories")
        .select("id, title")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(1)
        .single();

      const { data: act, error: aerr } = await client
        .from("good_acts")
        .insert({
          user_id: null,                  // or set to an admin user id if you prefer
          story_id: story?.id ?? null,    // nullable-safe
          title: story ? `Recognized: ${story.title}` : "Sample Act",
          created_at: nowISO()
        })
        .select("*")
        .single();

      if (aerr) {
        console.warn("! good_acts insert failed:", aerr.message);
        continue;
      }

      try {
        const res = await fetch(`${siteOrigin()}/api/certificates/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ act_id: act.id })
        });
        if (res.ok) {
          console.log(`✓ certificate generated for act ${act.id}`);
        } else {
          console.warn(`! certificate API returned ${res.status}`);
        }
      } catch (e) {
        console.warn("! certificate call failed:", (e as Error).message);
      }
    }
  }

  console.log("✔ Seeding complete");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
