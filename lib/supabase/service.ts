// lib/supabase/service.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * IMPORTANT:
 * - This module MUST NOT throw at import time.
 * - Only create the client if both URL and SERVICE key are present.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || null;

// Accept any of these env names for the service role key
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || // if you ever misnamed it
  null;

let cached: SupabaseClient | null | undefined;

function makeService(): SupabaseClient | null {
  if (!URL || !SERVICE_KEY) return null;
  return createClient(URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

/** Best-effort: returns null if env is missing. Never throws. */
export function trySupabaseService(): SupabaseClient | null {
  if (cached === undefined) cached = makeService();
  return cached ?? null;
}

/** Strict: throw ONLY when you explicitly require the service client. */
export function requireSupabaseService(): SupabaseClient {
  const svc = trySupabaseService();
  if (!svc) throw new Error("Supabase service client unavailable. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  return svc;
}
