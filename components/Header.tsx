// components/Header.tsx (SERVER)
import HeaderClient from "@/components/HeaderClient";
import { supabaseServer } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";

export default async function Header() {
  // Ensure this header is never cached (auth state must be live)
  noStore();

  const supabase = supabaseServer();

  // 1) Get current user (if any). Do not throw on error.
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  const user = userErr ? null : userRes?.user ?? null;

  // Defaults for unauthenticated users
  let name: string | null = null;
  let email: string | null = null;
  let avatar_url: string | null = null;

  if (user) {
    email = user.email ?? null;

    // 2) Prefer DB profile (RLS-protected). Swallow errors and fall back to metadata/email.
    let profileFullName: string | null = null;
    let profileAvatar: string | null = null;

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      profileFullName = (profile?.full_name ?? null) as string | null;
      profileAvatar = (profile?.avatar_url ?? null) as string | null;
    } catch {
      // ignore — we'll fall back below
    }

    const meta = (user.user_metadata || {}) as Record<string, unknown>;
    const metaName =
      typeof meta.full_name === "string" ? (meta.full_name as string) : null;
    const metaAvatar =
      typeof meta.avatar_url === "string" ? (meta.avatar_url as string) : null;

    const emailLocal = email ? email.split("@")[0] : null;

    name = profileFullName ?? metaName ?? emailLocal;
    avatar_url = profileAvatar ?? metaAvatar ?? null;
  }

  return <HeaderClient name={name} email={email} avatar_url={avatar_url} />;
}
