// lib/supabase/service.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Lazy + build-safe service client:
 * - Call with requireSupabaseService() inside handlers to get a Supabase client.
 * - trySupabaseService() returns null if env is missing (for optional metadata routes).
 * - Avoids initializing at import time to prevent build/prerender crashes.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY || // optional fallback if you used it before
  "";

// Single instance, created on demand
let _client: SupabaseClient | null = null;

function create(): SupabaseClient {
  return createClient(URL!, KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Strict getter: throws if env is missing, meant for API/server handlers */
export function requireSupabaseService(): SupabaseClient {
  if (_client) return _client;
  if (!URL || !KEY) {
    throw new Error(
      "Supabase service client unavailable. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  _client = create();
  return _client;
}

/** Safe getter: returns null when env missing (useful in sitemap/RSS/etc.) */
export function trySupabaseService(): SupabaseClient | null {
  if (_client) return _client;
  if (!URL || !KEY) return null;
  _client = create();
  return _client;
}
