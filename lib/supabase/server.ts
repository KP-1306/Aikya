// lib/supabase/server.ts
import { cookies, headers } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// If you have generated types, replace `any` with your Database type.
type Database = any;

/**
 * Always return a consistently-typed SupabaseClient.
 * Provides a safe shim when env is missing so SSR doesn't crash.
 */
export function supabaseServer(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // ---- Safe shim (no env) ----
  if (!url || !anon) {
    const q = {
      select: () => q, eq: () => q, is: () => q, gte: () => q,
      order: () => q, limit: () => q,
      maybeSingle: async () => ({ data: null, error: null } as const),
      single:      async () => ({ data: null, error: null } as const),
      insert:      async () => ({ data: null, error: null } as const),
      upsert:      async () => ({ data: null, error: null } as const),
      update:      async () => ({ data: null, error: null } as const),
      delete:      async () => ({ data: null, error: null } as const),
    };

    const stub = {
      from: (_: string) => q,
      rpc:  async (_fn: string, _args?: Record<string, unknown>) =>
        ({ data: null, error: null } as const),
      auth: {
        getUser: async () => ({ data: { user: null }, error: null } as const),
      },
    } as unknown as SupabaseClient<Database>;

    return stub;
  }

  // ---- Real server client (with cookies) ----
  try {
    return createServerClient<Database>(url, anon, {
      cookies: {
        get: (name: string) => cookies().get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) =>
          cookies().set({ name, value, ...options }),
        remove: (name: string, options: CookieOptions) =>
          cookies().set({ name, value: "", ...options }),
      },
      global: { headers: headers() },
    }) as unknown as SupabaseClient<Database>;
  } catch {
    // Fallback: plain client (no cookie wiring)
    return createClient<Database>(url, anon, { auth: { persistSession: false } });
  }
}
