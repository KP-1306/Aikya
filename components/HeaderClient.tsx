// components/HeaderClient.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Avatar from "@/components/Avatar";

type HeaderClientProps = {
  name: string | null;
  email: string | null;
  avatar_url: string | null;
};

export default function HeaderClient({
  name,
  email,
  avatar_url,
}: HeaderClientProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const isAuthed = Boolean(email);
  const displayName = useMemo(() => name || email || "Guest", [name, email]);

  const onSignOut = async () => {
    try {
      setBusy(true);
      await supabase.auth.signOut();
      router.replace("/");
      router.refresh();
    } catch {
      // no-op; navigation still returns user to home
    } finally {
      setBusy(false);
    }
  };

  return (
    <header className="container mx-auto flex items-center justify-between py-4">
      <Link href="/" className="text-base font-semibold">
        Aikya
      </Link>

      <nav className="flex items-center gap-4 text-sm">
        <Link href="/submit" className="hover:underline">
          Submit
        </Link>
        <Link href="/about" className="hover:underline">
          About
        </Link>
        <Link href="/contact" className="hover:underline">
          Contact
        </Link>

        {isAuthed ? (
          <div className="flex items-center gap-3">
            <span
              className="hidden max-w-[160px] truncate text-neutral-700 sm:inline"
              title={displayName}
            >
              {displayName}
            </span>

            <Avatar
              name={name ?? undefined}
              email={email ?? undefined}
              src={avatar_url ?? undefined}
              size={28}
            />

            <button
              type="button"
              onClick={onSignOut}
              disabled={busy}
              className="rounded-md border px-3 py-1 hover:bg-neutral-50 disabled:opacity-60"
            >
              {busy ? "Signing out…" : "Sign out"}
            </button>
          </div>
        ) : (
          <Link
            href="/signin"
            className="rounded-md bg-emerald-600 px-3 py-1 text-white"
          >
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
