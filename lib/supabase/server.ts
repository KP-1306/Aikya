// lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient, type SupabaseClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

/**
 * Server-aware Supabase client for Next.js (SSR/Route Handlers).
 * Returns a generic-erased SupabaseClient to avoid union overload issues
 * during Netlify/Next type-checking.
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
    });

    // Erase generics to avoid union-of-overloads on .from(...)
    return client as unknown as SupabaseClient<any, any, any>;
  } catch {
    // Fallback: plain client without cookies (still works for anon reads/RPCs)
    const plain = createClient(url, anon, { auth: { persistSession: false } });
    return plain as unknown as SupabaseClient<any, any, any>;
  }
}
