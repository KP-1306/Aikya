// lib/supabase/server.ts
import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/**
 * Return a server-aware Supabase client if env is present.
 * Falls back to a stateless plain client; if env is missing, returns a shim
 * that will never throw and always yields empty results.
 *
 * NOTE: We intentionally return `any` to avoid TS union-callability issues
 * with PostgREST query builders during Netlify builds.
 */
export function supabaseServer(): any {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    // Minimal shim with the handful of methods we use.
    const q = {
      select: () => q,
      eq: () => q,
      is: () => q,
      gte: () => q,
      order: () => q,
      limit: () => q,
      maybeSingle: async () => ({ data: null, error: null }),
      single: async () => ({ data: null, error: null }),
      insert: async () => ({ data: null, error: null }),
      upsert: async () => ({ data: null, error: null }),
      update: async () => ({ data: null, error: null }),
      delete: async () => ({ data: null, error: null }),
    };
    return {
      from() {
        return q;
      },
      rpc: async () => ({ data: null, error: null }),
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
      },
    } as any;
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
    }) as any;
  } catch {
    // Fallback to plain client (no cookies) – still safe
    return createClient(url, anon, { auth: { persistSession: false } }) as any;
  }
}
