import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export default async function AdminPartnersPage() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/signin");

  const { data: admin } = await sb.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) redirect("/");

  const { data } = await sb.from("partners").select("id,name,upi_id,scopes,created_at").order("created_at", { ascending: false });

  return (
    <div className="container py-8 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin · Partners</h1>
        <Link className="btn underline" href="/admin/partners/new">+ Add partner</Link>
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
            {(data ?? []).map(p => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-2">{p.name}</td>
                <td className="px-4 py-2">{p.upi_id}</td>
                <td className="px-4 py-2">{(p.scopes ?? []).join(", ") || "—"}</td>
                <td className="px-4 py-2">{new Date(p.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {(!data || data.length === 0) && (
              <tr><td colSpan={4} className="px-4 py-8 text-neutral-500">No partners yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
