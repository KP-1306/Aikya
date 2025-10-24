// lib/supabase/service.ts
import { createClient } from "@supabase/supabase-js";

// WARNING: This uses the service_role key. Never expose it to the browser.
// Do NOT prefix this secret with NEXT_PUBLIC_.
export const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,     // URL can be public
  process.env.SUPABASE_SERVICE_ROLE_KEY!,    // server-only secret
  { auth: { persistSession: false, autoRefreshToken: false } }
);
