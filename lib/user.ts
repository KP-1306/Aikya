// lib/user.ts
import { supabaseServer } from "@/lib/supabase/server";

export async function getCurrentUserState(): Promise<{ userId?: string; state?: string } | null> {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await sb
    .from("profiles")
    .select("state")
    .eq("id", user.id)
    .maybeSingle();
  if (error) return { userId: user.id }; // signed in but no profile row yet
  return { userId: user.id, state: profile?.state ?? undefined };
}
