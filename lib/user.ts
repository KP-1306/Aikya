// lib/user.ts
import { supabaseServer } from "@/lib/supabase/server";

export async function getCurrentUserRegion(): Promise<{
  userId?: string;
  city?: string;
  state?: string;
} | null> {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  const { data: profile } = await sb
    .from("profiles")
    .select("city, state")
    .eq("id", user.id)
    .maybeSingle();

  return { userId: user.id, city: profile?.city || undefined, state: profile?.state || undefined };
}
