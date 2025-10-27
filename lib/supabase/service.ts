// lib/supabase/service.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Lazy + backwards-compatible service client:
 *   - callable:  supabaseService() -> SupabaseClient
 *   - also acts like a client: supabaseService.from("table")...
 *   - does NOT initialize at import time (prevents build-time crashes)
 *   - if env is missing, it won't throw until you actually try to use it.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY || // optional fallback env name
  "";

// Single instance, created on demand
let _client: SupabaseClient | null = null;

function ensure(): SupabaseClient {
  if (_client) return _client;

  if (!URL || !KEY) {
    // Return a proxy that throws only when you actually call a method.
    // This avoids throwing during build/import.
    const thrower = new Proxy(
      {},
      {
        get() {
          throw new Error(
            "Supabase service client unavailable. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
          );
        },
        apply() {
          throw new Error(
            "Supabase service client unavailable. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
          );
        },
      }
    ) as unknown as SupabaseClient;
    // Don't cache the thrower; next successful ensure() with env set will build a real client.
    return thrower;
  }

  _client = createClient(URL, KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _client;
}

/** Callable function signature */
type ServiceCallable = () => SupabaseClient;

/** Export a callable that also behaves like a client via Proxy */
const callable: ServiceCallable = () => ensure();

export const supabaseService = new Proxy(callable as any, {
  // supabaseService() -> client
  apply() {
    return ensure();
  },
  // supabaseService.from / auth / rpc / etc.
  get(_target, prop, _receiver) {
    const client = ensure();
    // bind functions to the real client so `this` is correct
    const v = (client as any)[prop];
    return typeof v === "function" ? v.bind(client) : v;
  },
}) as unknown as SupabaseClient & ServiceCallable;

/** Safe getter: returns null instead of a throwing proxy if env is missing */
export function trySupabaseService(): SupabaseClient | null {
  if (!URL || !KEY) return null;
  return ensure();
}
