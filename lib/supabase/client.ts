// lib/supabase/client.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Client for browser usage (hooks, client components).
 * Keep this file tree-shakeable and free of server-only code.
 */
export const supabase = createClient(url, anon);
