// app/admin/support/[id]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = { params: { id: string } };

export default async function AdminSupportReview({ params }: PageProps) {
  const sb = supabaseServer();
  const sba = sb as any; // ✅ cast the client once

  // ---- Admin gate ----
  const isAdmin = await isAdminOrOwner(sba);
  if (!isAdmin) {
    return (
      <main className="container py-10">
        <h1 className="text-xl font-semibold mb-2">Forbidden</h1>
        <p className="text-sm text-neutral-600">
          You don’t have access to this page.{" "}
          <Link href="/signin" className="underline">Sign in</Link> with an admin/owner account.
        </p>
      </main>
    );
  }

  // ---- Load the Support Action ----
  const { data, error } = await sba
    .from("support_actions")
    .select("id,title,description,city,state,status,evidence_url,created_at,updated_at")
    .eq("id", params.id)
    .maybeSingle();

  if (error) {
    return (
      <main className="container py-10">
        <h1 className="text-xl font-semibold mb-2">Support Action</h1>
        <p className="text-sm text-red-600">Couldn’t load this item.</p>
        <pre className="mt-3 text-xs bg-neutral-50 p-3 rounded border overflow-auto">
{JSON.stringify({ message: "Query failed", error: error.message }, null, 2)}
        </pre>
      </main>
    );
  }

  if (!data) notFound();
  const a = data as any;

  // ---- Server action to update status ----
  async function SetStatus(formData: FormData) {
    "use server";
    const status = formData.get("status")?.toString();
    if (!status) return;

    const sb2 = supabaseServer();
    const sba2 = sb2 as any;
    const ok = await isAdminOrOwner(sba2);
    if (!ok) return;

    const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    await fetch(`${base}/api/admin/support/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
      cache: "no-store",
    });
  }

  return (
    <main className="container max-w-2xl py-10 space-y-6">
      <header className="space-y-1">
        <div className="text-xs text-neutral-500">
          {a.updated_at ? new Date(a.updated_at).toLocaleString() : "—"}
        </div>
        <h1 className="text-2xl font-semibold">Admin review</h1>
        <div className="text-sm">{a.title ?? "(untitled action)"}</div>
        <div className="text-xs rounded-full bg-neutral-100 inline-block px-2 py-0.5">
          {a.status ?? "draft"}
        </div>
      </header>

      <section className="space-y-2">
        {a.description ? (
          <p className="text-neutral-700 whitespace-pre-wrap">{a.description}</p>
        ) : (
          <p className="text-neutral-500">No description.</p>
        )}

        <div className="text-sm text-neutral-600">
          {a.city || a.state ? [a.city, a.state].filter(Boolean).join(", ") : "—"}
        </div>

        {a.evidence_url ? (
          <a href={a.evidence_url} target="_blank" className="text-sm underline break-all">
            Evidence
          </a>
        ) : (
          <div className="text-sm text-neutral-500">No evidence URL.</div>
        )}
      </section>

      <form action={SetStatus} className="flex gap-2 border-t pt-6">
        <input type="hidden" name="id" value={a.id} />
        <button name="status" value="in_progress" className="btn-secondary">Mark In-progress</button>
        <button name="status" value="verified" className="btn">Verify</button>
        <button name="status" value="rejected" className="btn-destructive">Reject</button>
        <button name="status" value="done" className="btn-secondary">Mark Done</button>
      </form>
    </main>
  );
}

// ---- helpers ----
async function isAdminOrOwner(sba: any): Promise<boolean> {
  // Ensure signed in
  const { data: userRes } = await sba.auth.getUser();
  const user = userRes?.user;
  if (!user) return false;

  // Try RPC is_admin() first
  try {
    const { data, error } = await sba.rpc("is_admin").single();
    if (!error && (data as unknown as boolean) === true) return true;
  } catch {
    // ignore and fall back
  }

  // Fallback: role from user_profiles, then profiles
  let role: string | null = null;

  const up = await sba
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!up.error) role = (up.data as any)?.role ?? null;

  if (!role) {
    const pf = await sba
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (!pf.error) role = (pf.data as any)?.role ?? null;
  }

  return role === "admin" || role === "owner";
}
