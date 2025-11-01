// lib/guards/admin.ts
import { supabaseServer } from "@/lib/supabase/server";
import { sbSafe } from "@/lib/supabase/safe";

export async function isAdminOrOwner(): Promise<boolean> {
  const sb = supabaseServer();
  const s  = sbSafe(sb);

  const { data: { user } } = await s.auth.getUser();
  if (!user) return false;

  try {
    const { data, error } = await s.rpc("is_admin").single();
    if (!error && data === true) return true;
  } catch {}

  // fallback: user_profiles.role then profiles.role
  const up = await s.from("user_profiles").select("role").eq("id", user.id).maybeSingle();
  const role = (up?.data as any)?.role ?? null;
  if (role === "admin" || role === "owner") return true;

  const pf = await s.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const role2 = (pf?.data as any)?.role ?? null;
  return role2 === "admin" || role2 === "owner";
}
