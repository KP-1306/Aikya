"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser (anon) client used by client components.
 * This file intentionally exports `supabase` as a named export
 * because many components import { supabase } from "@/lib/supabase/client".
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase: SupabaseClient = createClient(URL, KEY);

// Optional helper if you ever need a fresh instance
export function createBrowserClient(): SupabaseClient {
  return createClient(URL, KEY);
}

// Default export for code that does `import supabase from ...`
export default supabase;
