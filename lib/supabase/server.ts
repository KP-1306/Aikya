// lib/supabase/server.ts
import { createClient } from "@supabase/supabase-js";

/**
 * Simple server-side client for RSC / route handlers.
 * Uses the public anon key; use supabaseService for privileged ops.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function supabaseServer() {
  return createClient(url, anon);
}
