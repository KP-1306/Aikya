"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import { supabase } from "@/lib/supabase/client";

type Props = {
  name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
};

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`hover:underline ${active ? "text-emerald-700 font-medium" : ""}`}
    >
      {children}
    </Link>
  );
}

export default function HeaderClient({ name, email, avatar_url }: Props) {
  const router = useRouter();
  const signedIn = !!email;

  async function onSignOut() {
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="text-emerald-600">●</span> Aikya <span className="text-neutral-500">News</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <NavLink href="/submit">Submit</NavLink>
          <NavLink href="/about">About</NavLink>
          <NavLink href="/contact">Contact</NavLink>
        </nav>

        <div className="flex items-center gap-3">
          {signedIn ? (
            <>
              <span className="hidden sm:block text-sm truncate max-w-[160px]">
                {name || email}
              </span>
              <Avatar name={name || undefined} email={email || undefined} src={avatar_url || undefined} />
              <button
                onClick={onSignOut}
                className="rounded-md border px-3 py-1 text-sm hover:bg-neutral-50"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/signin"
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden border-t">
        <div className="container mx-auto flex items-center gap-6 px-4 py-2 text-sm">
          <NavLink href="/submit">Submit</NavLink>
          <NavLink href="/about">About</NavLink>
          <NavLink href="/contact">Contact</NavLink>
        </div>
      </div>
    </header>
  );
}
