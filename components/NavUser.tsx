// components/NavUser.tsx
import { supabaseServer } from "@/lib/supabase/server";
import Link from "next/link";
import SignOutButton from "./SignOutButton";

export default async function NavUser() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) {
    return (
      <Link href="/signin" className="rounded-full bg-brand text-white px-4 py-1.5">
        Sign in
      </Link>
    );
  }

  // Try to read profile name (optional)
  const { data: profile } = await sb.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  const name = profile?.full_name || user.email?.split("@")[0] || "Account";

  return (
    <div className="flex items-center gap-3">
      <Link href="/account" className="text-sm font-medium hover:underline">
        {name}
      </Link>
      <SignOutButton />
    </div>
  );
}
