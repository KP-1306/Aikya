// components/Header.tsx (SERVER)
import HeaderClient from "@/components/HeaderClient";
import { supabaseServer } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";

export default async function Header() {
  // Auth state must be fresh on every request
  noStore();

  const supabase = supabaseServer();

  // 1) Get current auth user (do not throw on error)
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  const user = userErr ? null : userRes?.user ?? null;

  // Defaults for signed-out
  let name: string | null = null;
  let email: string | null = null;
  let avatar_url: string | null = null;

  if (user) {
    email = user.email ?? null;

    // 2) Prefer DB profile; silently fall back to auth metadata/email
    let profileName: string | null = null;
    let profileAvatar: string | null = null;

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      profileName = (profile?.full_name ?? null) as string | null;
      profileAvatar = (profile?.avatar_url ?? null) as string | null;
    } catch {
      // ignore and fallback to metadata below
    }

    const meta = (user.user_metadata || {}) as Record<string, unknown>;
    const metaName =
      typeof meta.full_name === "string"
        ? (meta.full_name as string)
        : typeof meta.name === "string"
        ? (meta.name as string)
        : null;
    const metaAvatar =
      typeof meta.avatar_url === "string"
        ? (meta.avatar_url as string)
        : typeof meta.picture === "string"
        ? (meta.picture as string)
        : null;

    const emailLocal = email ? email.split("@")[0] : null;

    name = profileName ?? metaName ?? emailLocal;
    avatar_url = profileAvatar ?? metaAvatar ?? null;
  }

  // Pass initial values to the client header; it will refresh on mount
  return <HeaderClient name={name} email={email} avatar_url={avatar_url} />;
}
