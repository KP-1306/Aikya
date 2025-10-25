import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

export default async function SupportHubPage({ searchParams }: { searchParams?: Record<string,string|undefined> }) {
  const sb = supabaseServer();
  let q = sb.from("support_requests")
    .select("id, kind, title, state, city, created_at, status, visibility")
    .eq("status","open")
    .order("created_at",{ ascending:false });

  if (searchParams?.kind) q = q.eq("kind", searchParams.kind);
  if (searchParams?.state) q = q.eq("state", searchParams.state);

  const { data } = await q;

  return (
    <div className="container py-8 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Support</h1>
        <div className="flex gap-3 text-sm">
          <Link className="underline" href="/support/new">Ask for support</Link>
          <Link className="underline" href="/support/offers/new">Offer support</Link>
        </div>
      </header>

      <div className="grid gap-3">
        {(data ?? []).map(r => (
          <Link key={r.id} href={`/support/${r.id}`} className="rounded-xl border bg-white/70 p-4">
            <div className="text-sm text-neutral-500">{r.kind} · {r.state || r.city || "—"}</div>
            <div className="font-medium">{r.title}</div>
            <div className="text-xs text-neutral-500">{new Date(r.created_at).toLocaleString()}</div>
          </Link>
        ))}
        {(!data || data.length === 0) && <div className="text-neutral-500">No open requests yet.</div>}
      </div>
    </div>
  );
}
