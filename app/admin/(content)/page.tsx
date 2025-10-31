// app/admin/(content)/page.tsx
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin · Content — Aikya",
  description: "Admin landing for content tools.",
};

function Card({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="card p-4 hover:ring-1 hover:ring-black/10 transition"
    >
      <div className="text-lg font-semibold">{title}</div>
      <p className="text-sm text-neutral-600">{desc}</p>
    </Link>
  );
}

export default async function AdminContentHome() {
  await assertAdminOrOwner();

  return (
    <div className="container py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Admin · Content</h1>
        <p className="text-sm text-neutral-600">
          Create, review and moderate Aikya content. Shortcuts below.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* NOTE: Route groups like (content) are not part of the URL. */}
        <Card
          href="/admin/acts"
          title="Good Acts"
          desc="Verify & manage Proof-of-Good submissions."
        />
        <Card
          href="/admin/drafts"
          title="Drafts"
          desc="Work on story drafts, copy and assets."
        />
        <Card
          href="/admin/flags"
          title="Flags"
          desc="See flagged items that need attention."
        />
        <Card
          href="/admin/moderation"
          title="Moderation"
          desc="Approve, hide or ban users based on reports."
        />
        <Card
          href="/admin/stories"
          title="Stories"
          desc="Publish, unpublish and manage stories."
        />
        <Card
          href="/admin/analytics"
          title="Analytics"
          desc="Quick engagement and reach snapshots."
        />
        <Card
          href="/admin/ingest"
          title="Ingest / Curation"
          desc="Seed, import or curate sources for Aikya."
        />
        <Card
          href="/admin/partners"
          title="Partners"
          desc="Property/partner management (contacts & status)."
        />
        <Card
          href="/admin/support"
          title="Support Engine"
          desc="Configure action types, review queue, karma rules."
        />

        {/* Weekly Digest preview (HTML); sending handled by Netlify function if email keys exist */}
        <Card
          href="/api/admin/digest/preview"
          title="Weekly Digest (Preview)"
          desc="Preview this week’s email. Sending runs via Netlify function if email keys are set."
        />
      </section>
    </div>
  );
}

/**
 * Server-side guard:
 * 1) Prefer RPC is_admin() returning boolean (ignore failure cleanly)
 * 2) Fallback to role from user_profiles, then profiles
 * 3) Redirect if not admin/owner
 */
async function assertAdminOrOwner() {
  const sb = supabaseServer();

  // Ensure we have a signed-in user
  const { data: userRes } = await sb.auth.getUser();
  const user = userRes?.user;
  if (!user) redirect("/signin");

  // 1) Try RPC is_admin()
  let isAdmin: boolean | null = null;
  try {
    // .single() returns { data, error }; no .catch() chaining needed
    const { data, error } = await sb.rpc("is_admin").single();
    if (!error) {
      // RPC often returns a scalar; cast safely
      isAdmin = (data as unknown as boolean) ?? null;
    }
  } catch {
    // swallow; we'll fall back to role checks
  }
  if (isAdmin === true) return;

  // 2) Fallback: role from user_profiles, then profiles
  let role: string | null = null;

  // Try user_profiles first
  const up = await sb
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!up.error) role = (up.data as any)?.role ?? null;

  // Fallback to profiles if user_profiles isn’t present
  if (!role) {
    const pf = await sb
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (!pf.error) role = (pf.data as any)?.role ?? null;
  }

  if (role === "admin" || role === "owner") return;

  // 3) Not authorized
  redirect("/signin?error=not_authorized");
}
