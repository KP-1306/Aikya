// components/HeaderClient.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Avatar from "@/components/Avatar";

type HeaderClientProps = {
  name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
};

type Me = {
  name: string | null;
  email: string | null;
  avatar_url: string | null;
};

export default function HeaderClient(props: HeaderClientProps) {
  // Seed initial state from props (sent by the server Header) if present
  const [me, setMe] = useState<Me | null>(
    props && (props.name || props.email || props.avatar_url)
      ? {
          name: props.name ?? null,
          email: props.email ?? null,
          avatar_url: props.avatar_url ?? null,
        }
      : null
  );

  useEffect(() => {
    let mounted = true;

    // If we already have user info from props, still try to refresh from client
    // to keep UI reactive to auth state changes.
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!mounted) return;

      if (!user) {
        setMe(null);
        return;
      }

      const name =
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        null;

      const avatar_url =
        (user.user_metadata?.avatar_url as string | undefined) ?? null;

      setMe({
        name,
        email: user.email ?? null,
        avatar_url,
      });
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="flex items-center gap-3">
      {me ? (
        <>
          <Avatar
            name={me.name ?? undefined}
            email={me.email ?? undefined}
            src={me.avatar_url ?? undefined}
            size={28}
          />
          <span className="text-sm text-neutral-700 max-w-[12rem] truncate">
            {me.name || me.email}
          </span>
          <Link href="/account" className="text-sm underline">
            Account
          </Link>
        </>
      ) : (
        <>
          <Link href="/auth/signin" className="text-sm underline">
            Sign in
          </Link>
          <Link href="/auth/signup" className="text-sm underline">
            Create account
          </Link>
        </>
      )}
    </div>
  );
}
