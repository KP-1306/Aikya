// lib/supabase/server.ts
import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Return a server-aware Supabase client for Next.js Route Handlers/SSR.
 * We erase generics on the return type to avoid union-overload issues
 * (the “This expression is not callable” error on .from()) during build.
 */
export function supabaseServer(): SupabaseClient<any, any, any> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // ---- Missing env → safe shim so SSR never crashes ----
  if (!url || !anon) {
    const shim: any = {
      from() {
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
        return q;
      },
      rpc: async () => ({ data: null, error: null }),
      storage: {
        from() {
          return {
            upload: async () => ({ data: null, error: null }),
            getPublicUrl: () => ({ data: { publicUrl: null } }),
          };
        },
      },
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
      },
    };
    return shim as SupabaseClient<any, any, any>;
  }

  // ---- Proper server client with cookie wiring ----
  try {
    const cookieStore = cookies();
    const client = createServerClient(url, anon, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: any) =>
          cookieStore.set({ name, value, ...options }),
        remove: (name: string, options: any) =>
          cookieStore.set({ name, value: "", ...options }),
      },
      global: { headers: headers() },
    });

    // Erase generics to prevent type-union overloads on .from(...)
    return client as unknown as SupabaseClient<any, any, any>;
  } catch {
    // Fallback: plain client without cookies (still fine for anon reads/RPCs)
    const plain = createClient(url, anon, { auth: { persistSession: false } });
    return plain as unknown as SupabaseClient<any, any, any>;
  }
}
