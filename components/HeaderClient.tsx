// components/HeaderClient.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Avatar from "@/components/Avatar";

type Me = {
  name: string | null;
  email: string | null;
  avatar_url: string | null;
};

export default function HeaderClient() {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!mounted) return;

      // If you have a profile table, you can fetch it here; for now, use auth metadata
      const name =
        (user?.user_metadata?.full_name as string | undefined) ??
        (user?.user_metadata?.name as string | undefined) ??
        null;

      const avatar_url =
        (user?.user_metadata?.avatar_url as string | undefined) ?? null;

      setMe({
        name,
        email: user?.email ?? null,
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
          <form
            action={async () => {
              "use server";
              // If you already have a server action, keep that; otherwise call a route
            }}
          />
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
