// lib/supabase/server.ts
import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

type ServerClient = ReturnType<typeof createServerClient>;
type PlainClient  = ReturnType<typeof createClient>;

/**
 * Server-aware Supabase client. If env is missing, returns a safe shim
 * whose methods resolve to { data:null, error:null } so SSR never crashes.
 */
export function supabaseServer(): ServerClient | PlainClient {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    // Safe shim (prevents “callable union” TS errors and runtime crashes)
    // @ts-expect-error – typed as permissive shim
    return {
      from() {
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
      rpc: async () => ({ data: null, error: null }),
      auth: { getUser: async () => ({ data: { user: null }, error: null }) },
    };
  }

  try {
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
    // Fallback (no cookies). Still safe for API routes.
    return createClient(url, anon, { auth: { persistSession: false } });
  }
}
