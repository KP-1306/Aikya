// app/admin/support/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import AdminHideToggle from "@/components/AdminHideToggle";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Req = {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  state: string | null;
  city: string | null;
  status: "open" | "matched" | "in_progress" | "completed" | "cancelled" | "hidden";
  created_at: string;
};

type Offer = {
  id: string;
  user_id: string;
  kinds: string[];
  headline: string;
  state: string | null;
  city: string | null;
  status: "active" | "withdrawn" | "hidden";
  created_at: string;
};

// Shared, build-safe admin guard
async function assertAdminOrOwner() {
  const sb = supabaseServer();
  const sba = sb as any; // ✅ cast the client once

  const { data: userRes } = await sba.auth.getUser();
  const user = userRes?.user;
  if (!user) redirect("/signin");

  // Prefer RPC
  try {
    const { data, error } = await sba.rpc("is_admin").single();
    if (!error && (data as unknown as boolean) === true) return { sb: sba, userId: user.id };
  } catch {
    /* swallow; fall back */
  }

  // Fallback: user_profiles → profiles
  let role: string | null = null;

  const up = await sba.from("user_profiles").select("role").eq("id", user.id).maybeSingle();
  if (!up.error) role = (up.data as any)?.role ?? null;

  if (!role) {
    const pf = await sba.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!pf.error) role = (pf.data as any)?.role ?? null;
  }

  if (role === "admin" || role === "owner") return { sb: sba, userId: user.id };

  redirect("/"); // not authorized
}

async function guardAndFetch() {
  const { sb } = await assertAdminOrOwner(); // sb is already the casted client (sba)

  const [{ data: reqs }, { data: offers }] = await Promise.all([
    sb.from("support_requests")
      .select("id,user_id,kind,title,state,city,status,created_at")
      .order("created_at", { ascending: false }),
    sb.from("support_offers")
      .select("id,user_id,kinds,headline,state,city,status,created_at")
      .order("created_at", { ascending: false }),
  ]);

  return {
    requests: (reqs ?? []) as Req[],
    offers: (offers ?? []) as Offer[],
  };
}

export default async function AdminSupportPage() {
  const { requests, offers } = await guardAndFetch();

  return (
    <div className="container py-8 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin · Support Moderation</h1>
          <p className="text-sm text-neutral-600">
            Review & hide/unhide support requests and supporter offers.
          </p>
        </div>
        <nav className="text-sm">
          <Link href="/admin/stories" className="underline hover:no-underline">
            Stories
          </Link>
        </nav>
      </header>

      {/* Requests */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Requests</h2>
        <div className="rounded-xl border bg-white/70 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50">
              <tr className="text-left">
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Kind</th>
                <th className="px-4 py-2">Location</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Created</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-neutral-500">
                    No requests found.
                  </td>
                </tr>
              )}
              {requests.map((r) => (
                <tr key={r.id} className="border-t align-top">
                  <td className="px-4 py-2">{r.title}</td>
                  <td className="px-4 py-2">{r.kind}</td>
                  <td className="px-4 py-2">{r.city || r.state || "—"}</td>
                  <td className="px-4 py-2">
                    <span className="rounded bg-neutral-200 px-2 py-0.5">{r.status}</span>
                  </td>
                  <td className="px-4 py-2">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <AdminHideToggle kind="request" id={r.id} hidden={r.status === "hidden"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Offers */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Offers</h2>
        <div className="rounded-xl border bg-white/70 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50">
              <tr className="text-left">
                <th className="px-4 py-2">Headline</th>
                <th className="px-4 py-2">Kinds</th>
                <th className="px-4 py-2">Location</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Created</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {offers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-neutral-500">
                    No offers found.
                  </td>
                </tr>
              )}
              {offers.map((o) => (
                <tr key={o.id} className="border-t align-top">
                  <td className="px-4 py-2">{o.headline}</td>
                  <td className="px-4 py-2">{(o.kinds || []).join(", ") || "—"}</td>
                  <td className="px-4 py-2">{o.city || o.state || "—"}</td>
                  <td className="px-4 py-2">
                    <span className="rounded bg-neutral-200 px-2 py-0.5">{o.status}</span>
                  </td>
                  <td className="px-4 py-2">{new Date(o.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <AdminHideToggle kind="offer" id={o.id} hidden={o.status === "hidden"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-neutral-500">
        Hiding sets status to <code>hidden</code>. Unhiding returns to <code>open</code> (requests)
        or <code>active</code> (offers).
      </p>
    </div>
  );
}
