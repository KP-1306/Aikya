// app/admin/ingest/page.tsx
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin · Ingest / Curation — Aikya",
  description: "Seed, import or curate sources for Aikya.",
};

export default async function AdminIngestPage() {
  await assertAdminOrOwner();

  return (
    <div className="container py-8 space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Ingest / Curation</h1>
        <p className="text-sm text-neutral-600">
          Tools to seed, import and curate content for Aikya. This page is schema-tolerant and won’t break builds if optional tables are missing.
        </p>
      </header>

      {/* Quick links (keep simple, avoid tight coupling) */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminCard
          title="Admin: Digest Preview"
          desc="Preview this week’s email digest (HTML)."
          href="/api/admin/digest/preview"
        />
        <AdminCard
          title="Import Stories (CSV)"
          desc="Upload CSV to seed stories (server function expected)."
          href="/admin/ingest/upload"
        />
        <AdminCard
          title="Curate Sources"
          desc="Manage source feeds and whitelists."
          href="/admin/ingest/sources"
        />
      </section>

      {/* Lightweight placeholders so page renders even if routes aren’t ready */}
      <section className="card p-4">
        <div className="text-sm text-neutral-600">
          Need CSV template? Download a minimal layout with <code>title, slug, dek, city, state, category, hero_image, published_at</code>.
        </div>
        <div className="mt-3">
          <a
            className="btn"
            href="/api/admin/ingest/template.csv"
          >
            Download CSV Template
          </a>
        </div>
      </section>
    </div>
  );
}

function AdminCard({ title, desc, href }: { title: string; desc: string; href: string }) {
  return (
    <Link href={href} className="card p-4 hover:ring-1 hover:ring-black/10 transition">
      <div className="text-lg font-semibold">{title}</div>
      <p className="text-sm text-neutral-600">{desc}</p>
    </Link>
  );
}

/**
 * Admin/Owner guard (union-safe):
 * - Try RPC is_admin()
 * - Fallback to admins table
 * - Fallback to user_profiles, then profiles
 * - Redirect to /signin if unauthorized
 */
async function assertAdminOrOwner() {
  const sb: any = supabaseServer(); // Cast avoids “.from is not callable” union error on Netlify

  const { data: userRes } = await sb.auth.getUser();
  const user = userRes?.user;
  if (!user) redirect("/signin");

  // 1) RPC is_admin (tolerate different return shapes)
  try {
    const { data: rpcData } = await sb.rpc("is_admin");
    const rpcBool =
      rpcData === true ||
      rpcData === "t" ||
      (rpcData && typeof rpcData === "object" && (rpcData.is_admin === true || rpcData.is_admin === "t"));
    if (rpcBool) return;
  } catch {
    // ignore
  }

  // 2) admins table (optional)
  try {
    const { data: admin } = await sb
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (admin?.user_id) return;
  } catch {
    // ignore
  }

  // 3) user_profiles → profiles fallback (optional)
  let role: string | null = null;
  try {
    const up = await sb
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (!up?.error && up?.data) role = (up.data as any).role ?? null;
  } catch {
    // ignore
  }

  if (!role) {
    try {
      const pf = await sb
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (!pf?.error && pf?.data) role = (pf.data as any).role ?? null;
    } catch {
      // ignore
    }
  }

  if (role === "admin" || role === "owner") return;

  redirect("/signin?error=not_authorized");
}
