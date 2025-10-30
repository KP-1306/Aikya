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

async function requireAdmin() {
  const sb = supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/signin");

  // Prefer RPC if you created it; otherwise fall back to profiles.role
  const rpc = await sb.rpc("is_admin").single().catch(() => ({ data: null as null | boolean }));
  if (rpc?.data === true) return;

  const { data: prof } = await sb
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (prof?.role !== "admin") redirect("/");
}

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
  await requireAdmin();

  return (
    <div className="container py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Admin · Content</h1>
        <p className="text-sm text-neutral-600">
          Create, review and moderate Aikya content. Shortcuts below.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          href="/admin/(content)/acts"
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

        {/* New: Weekly Digest preview (opens HTML preview; sending handled by Netlify function) */}
        <Card
          href="/api/admin/digest/preview"
          title="Weekly Digest (Preview)"
          desc="Preview this week’s email. Sending runs via Netlify function if email keys are set."
        />
      </section>
    </div>
  );
}
