// lib/supabase/service.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * IMPORTANT:
 * Do NOT create the client at module top. Next.js may import this file while
 * collecting page data during the build, and if the service key is missing,
 * Supabase will throw and break the build.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

/** Throwing creator (use in places where you *require* the service role). */
export function supabaseService(): SupabaseClient {
  const KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||            // fallback name if you used it
    "";                                            // force check below

  if (!URL || !KEY) {
    throw new Error("Supabase service client is not configured (missing URL or service role key).");
  }

  return createClient(URL, KEY, {
    auth: { persistSession: false },
  });
}

/** Non-throwing helper (returns null when the key is not configured). */
export function trySupabaseService(): SupabaseClient | null {
  const KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    null;

  if (!URL || !KEY) return null;

  return createClient(URL, KEY, {
    auth: { persistSession: false },
  });
}
