// lib/supabase/service.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * We export a *hybrid* object that is:
 *   1) callable:  supabaseService() -> SupabaseClient
 *   2) also a client: supabaseService.from("table")...
 *
 * This lets existing code keep using either style without build/type errors.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY || // fallback env name if you used it
  "";

// Ensure we only create one client
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;
  if (!URL || !KEY) {
    throw new Error(
      "Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  _client = createClient(URL, KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return _client;
}

/** Hybrid type: function AND client */
export type ServiceHybrid = (() => SupabaseClient) & SupabaseClient;

/** Build the callable+client hybrid */
function buildHybrid(): ServiceHybrid {
  const client = getClient();
  const fn = (() => client) as unknown as ServiceHybrid;
  // copy all client methods/props onto the function object
  Object.assign(fn, client);
  return fn;
}

/** Use this everywhere (works as function OR as client) */
export const supabaseService: ServiceHybrid = buildHybrid();

/** Safe getter that returns null instead of throwing if env is missing */
export function trySupabaseService(): SupabaseClient | null {
  try {
    return getClient();
  } catch {
    return null;
  }
}
