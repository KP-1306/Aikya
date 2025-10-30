// lib/admin.ts
import { supabaseServer } from "@/lib/supabase/server";

export async function requireAdmin(): Promise<{ userId: string }> {
  const sb = supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Preferred: admins table
  const { data: admin } = await sb
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (admin) return { userId: user.id };

  // Fallback: profiles.role
  const { data: prof } = await sb
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (prof?.role === "admin") return { userId: user.id };

  throw new Error("Not authorized");
}
