// app/admin/(content)/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Admin — Aikya" };

async function ensureAdmin() {
  const sb = supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/signin");

  // Prefer the is_admin() RPC if present; fallback to profiles.role
  try {
    const { data } = await sb.rpc("is_admin").single();
    if (data === true) return;
  } catch {
    // ignore and try fallback
  }
  const { data: prof } = await sb
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (prof?.role !== "admin") redirect("/");
}

export default async function AdminHome() {
  await ensureAdmin();

  const tiles: Array<{ href: string; title: string; sub: string }> = [
    { href: "/admin/drafts",      title: "Drafts",      sub: "Review & publish story drafts" },
    { href: "/admin/flags",       title: "Flags",       sub: "Handle flagged comments/stories" },
    { href: "/admin/moderation",  title: "Moderation",  sub: "Approve/hide comments, ban users" },
    { href: "/admin/stories",     title: "Stories",     sub: "Browse, edit, or delete stories" },
    { href: "/admin/acts",        title: "Proof-of-Good", sub: "Verify submitted good acts" },
    { href: "/admin/support",     title: "Support",     sub: "Review Support Engine actions" },
    { href: "/admin/ingest",      title: "Ingest",      sub: "Normalize articles & run preview" },
    { href: "/admin/analytics",   title: "Analytics",   sub: "Traffic & engagement snapshots" },
    { href: "/admin/partners",    title: "Partners",    sub: "Manage partner properties" },
  ];

  return (
    <div className="container py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="text-sm text-neutral-600">
          Quick links to moderation, publishing, and operational tools.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <li key={t.href} className="card p-4 hover:ring-1 hover:ring-black/5 transition">
            <Link href={t.href} className="block">
              <h2 className="font-semibold">{t.title}</h2>
              <p className="text-sm text-neutral-600 mt-1">{t.sub}</p>
              <span className="inline-block text-sm mt-3 underline">Open</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
