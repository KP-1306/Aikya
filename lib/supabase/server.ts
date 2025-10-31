// lib/supabase/server.ts
import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

type ServerClient = ReturnType<typeof createServerClient>;
type PlainClient  = ReturnType<typeof createClient>;

/**
 * Return a server-aware Supabase client if env is present.
 * Falls back to a stateless plain client; if env is missing, returns a shim
 * that will never throw and always yields empty results.
 */
export function supabaseServer(): ServerClient | PlainClient {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    // Minimal shim with the handful of methods we use.
    // All calls return empty { data: null, error: null } so SSR never crashes.
    // @ts-expect-error – typed as any shim
    return {
      from() {
        // chainable stub
        const q = {
          select: () => q, eq: () => q, is: () => q, gte: () => q,
          order: () => q, limit: () => q,
          maybeSingle: async () => ({ data: null, error: null }),
          single:      async () => ({ data: null, error: null }),
          insert:      async () => ({ data: null, error: null }),
          upsert:      async () => ({ data: null, error: null }),
          update:      async () => ({ data: null, error: null }),
          delete:      async () => ({ data: null, error: null }),
        };
        return q;
      },
      auth: {
        // @ts-expect-error
        getUser: async () => ({ data: { user: null }, error: null }),
      },
    };
  }

  try {
    // Proper server client (with auth cookie wiring)
    return createServerClient(url, anon, {
      cookies: {
        get: (name: string) => cookies().get(name)?.value,
        set: (name: string, value: string, options: any) =>
          cookies().set({ name, value, ...options }),
        remove: (name: string, options: any) =>
          cookies().set({ name, value: "", ...options }),
      },
      global: { headers: headers() },
    });
  } catch {
    // Fallback to plain client (no cookies) – still safe
    return createClient(url, anon, { auth: { persistSession: false } });
  }
}
