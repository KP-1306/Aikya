"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type P = { className?: string; size?: number };

export default function Avatar({ className = "", size = 32 }: P) {
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email ?? null);
      // Try profile first; fall back to user metadata
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      setName(prof?.full_name || (user.user_metadata?.name as string) || user.email?.split("@")[0] || null);
      setPhoto(prof?.avatar_url || (user.user_metadata?.avatar_url as string) || null);
    })();
  }, []);

  const initials = useMemo(() => {
    if (!name && !email) return "U";
    const src = (name || email || "U").trim();
    const parts = src.split(/\s+/);
    const first = parts[0]?.[0] || "U";
    const second = parts[1]?.[0] || "";
    return (first + second).toUpperCase();
  }, [name, email]);

  if (!name && !email) {
    // Not signed in → show Sign in
    return (
      <Link href="/auth/signin" className="rounded-full px-3 py-1 text-sm font-medium ring-1 ring-black/10 hover:bg-neutral-50">
        Sign in
      </Link>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        aria-label="Account"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full ring-1 ring-black/10 bg-white hover:bg-neutral-50 px-2 py-1"
      >
        <div
          className="grid place-items-center rounded-full bg-emerald-600 text-white font-semibold"
          style={{ width: size, height: size }}
        >
          {photo ? (
            <Image
              src={photo}
              alt={name || email || "User"}
              width={size}
              height={size}
              className="rounded-full object-cover"
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <span className="hidden sm:block text-sm max-w-[12ch] truncate">{name || email}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-xl border border-neutral-200 bg-white shadow-lg ring-1 ring-black/5 p-2"
        >
          <div className="px-2 py-1">
            <div className="text-sm font-medium truncate">{name || email}</div>
            {email && <div className="text-xs text-neutral-500 truncate">{email}</div>}
          </div>
          <hr className="my-2 border-neutral-200" />
          <Link href="/me" className="block rounded-md px-2 py-2 text-sm hover:bg-neutral-50">Profile</Link>
          <Link href="/submit" className="block rounded-md px-2 py-2 text-sm hover:bg-neutral-50">Submit a story</Link>
          <button
            className="mt-1 w-full rounded-md px-2 py-2 text-left text-sm hover:bg-neutral-50"
            onClick={async () => { await supabase.auth.signOut(); window.location.assign("/"); }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
