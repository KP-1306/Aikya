// components/HeaderClient.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

type HeaderClientProps = {
  name: string | null;
  email: string | null;
  avatar_url: string | null;
};

// Util: get initials from name or fall back to email local-part
function getInitials(name?: string | null, fallback?: string | null) {
  const base = (name && name.trim()) || (fallback ? fallback.split("@")[0] : "");
  if (!base) return "A";
  const parts = base.split(/\s+/).filter(Boolean);
  const init =
    (parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[1]?.[0] ?? "" : "");
  return init.toUpperCase() || "A";
}

// Simple avatar with image + initials fallback
function Avatar({
  name,
  email,
  src,
  size = 32,
}: {
  name?: string | null;
  email?: string | null;
  src?: string | null;
  size?: number;
}) {
  const [showImg, setShowImg] = useState(Boolean(src));
  const initials = getInitials(name, email);
  const px = `${size}px`;

  return (
    <div
      className="relative inline-flex select-none items-center justify-center overflow-hidden rounded-full bg-emerald-600 text-white text-xs font-semibold"
      style={{ width: px, height: px }}
      aria-label={name || email || "User"}
    >
      {showImg && src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name || email || "Avatar"}
          className="h-full w-full rounded-full object-cover"
          onError={() => setShowImg(false)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

export default function HeaderClient({
  name,
  email,
  avatar_url,
}: HeaderClientProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onSignOut() {
    try {
      setBusy(true);
      await supabase.auth.signOut();
      router.replace("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const displayName = name || email || "Guest";

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

        {email ? (
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-neutral-700">{displayName}</span>
            <Avatar name={name} email={email} src={avatar_url} />
            <button
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
