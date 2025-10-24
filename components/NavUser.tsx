// components/NavUser.tsx
import { supabaseServer } from "@/lib/supabase/server";
import Link from "next/link";
import SignOutButton from "./SignOutButton";

export default async function NavUser() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();

  // Not signed in → show CTA
  if (!user) {
    return (
      <Link
        href="/signin"
        className="rounded-full bg-brand text-white px-4 py-1.5"
      >
        Sign in
      </Link>
    );
  }

  // Signed in → fetch profile (name + avatar)
  const { data: profile } = await sb
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const name = profile?.full_name || user.email?.split("@")[0] || "Account";
  const avatar = profile?.avatar_url || "/avatar-fallback.png";

  return (
    <div className="flex items-center gap-3">
      <Link href="/account" className="flex items-center gap-2 group">
        <span className="hidden sm:inline text-sm font-medium group-hover:underline">
          {name}
        </span>
        <span className="inline-block h-8 w-8 overflow-hidden rounded-full ring-1 ring-black/10 bg-neutral-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatar}
            alt="Avatar"
            className="h-full w-full object-cover"
          />
        </span>
      </Link>
      <SignOutButton />
    </div>
  );
}
