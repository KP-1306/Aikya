// app/admin/partners/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Admin · Partners — Aikya" };

export default async function AdminPartnersPage() {
  const sb: any = supabaseServer();

  // Auth
  const { data: userRes } = await sb.auth.getUser();
  const user = userRes?.user;
  if (!user) redirect("/signin");

  // --- Admin check (robust): RPC → admins table → profiles.role ---
  let isAdmin = false;

  // 1) RPC is_admin()
  try {
    const { data: rpcData } = await sb.rpc("is_admin");
    if (
      rpcData === true ||
      rpcData === "t" ||
      (rpcData && typeof rpcData === "object" && (rpcData.is_admin === true || rpcData.is_admin === "t"))
    ) {
      isAdmin = true;
    }
  } catch {
    /* ignore */
  }

  // 2) admins table
  if (!isAdmin) {
    try {
      const { data: adminRow } = await sb
        .from("admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (adminRow) isAdmin = true;
    } catch {
      /* ignore */
    }
  }

  // 3) profiles.role fallback
  if (!isAdmin) {
    try {
      const { data: prof } = await sb
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (prof?.role === "admin" || prof?.role === "owner") isAdmin = true;
    } catch {
      /* ignore */
    }
  }

  if (!isAdmin) redirect("/");

  // --- Fetch partners (safe) ---
  let rows: any[] = [];
  try {
    const { data } = await sb
      .from("partners")
      .select("id,name,upi_id,scopes,created_at")
      .order("created_at", { ascending: false });
    rows = data ?? [];
  } catch {
    rows = [];
  }

  return (
    <div className="container py-8 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin · Partners</h1>
        <Link className="btn underline" href="/admin/partners/new">
          + Add partner
        </Link>
      </header>

      <div className="rounded-xl border bg-white/70 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50">
            <tr className="text-left">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">UPI</th>
              <th className="px-4 py-2">Scopes</th>
              <th className="px-4 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p: any) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-2">{p.name}</td>
                <td className="px-4 py-2">{p.upi_id ?? "—"}</td>
                <td className="px-4 py-2">
                  {(Array.isArray(p.scopes) ? p.scopes : [])?.join(", ") || "—"}
                </td>
                <td className="px-4 py-2">
                  {p.created_at ? new Date(p.created_at).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-neutral-500">
                  No partners yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
