// components/Header.tsx (SERVER)
import HeaderClient from "@/components/HeaderClient";
import { supabaseServer } from "@/lib/supabase/server";

export default async function Header() {
  const supabase = supabaseServer();

  // Get the current auth user (if any)
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;

  // Defaults (unauthenticated or missing profile fields)
  let name: string | null = null;
  let email: string | null = null;
  let avatar_url: string | null = null;

  if (user) {
    email = user.email ?? null;

    // Try to load profile from DB first
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    // Prefer DB profile; fall back to user_metadata; then email local-part
    const meta = (user.user_metadata || {}) as Record<string, any>;
    const emailLocal = email ? email.split("@")[0] : null;

    name =
      profile?.full_name ??
      (typeof meta.full_name === "string" ? meta.full_name : null) ??
      emailLocal;

    avatar_url =
      profile?.avatar_url ??
      (typeof meta.avatar_url === "string" ? meta.avatar_url : null);
  }

  return <HeaderClient name={name} email={email} avatar_url={avatar_url} />;
}
