// app/admin/analytics/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";

type Row = { day: string; kind: "pageview"|"like"|"save"; count: number };
type TopRow = { path: string | null; count: number };

export default async function AdminAnalyticsPage() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/signin");
  const { data: admin } = await sb.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) redirect("/");

  // Last 7 full days (server-side via service role; analytics table is RLS-locked)
  const { data: daily } = await supabaseService.rpc("analytics_last_7_days"); // if you add RPC below
  // Fallback without RPC: run two simple selects
  const dailyRows: Row[] = daily ?? (await getDailyFallback());
  const { data: top } = await supabaseService
    .from("analytics_events")
    .select("path, count:id", { count: "exact", head: false })
    .gte("created_at", new Date(Date.now() - 7*24*3600*1000).toISOString())
    .eq("kind", "pageview")
    .not("path", "is", null)
    .group("path")
    .order("count", { ascending: false })
    .limit(20) as unknown as { data: TopRow[] };

  const totals = {
    pageview: dailyRows.filter(r=>r.kind==="pageview").reduce((a,b)=>a+b.count,0),
    like:      dailyRows.filter(r=>r.kind==="like").reduce((a,b)=>a+b.count,0),
    save:      dailyRows.filter(r=>r.kind==="save").reduce((a,b)=>a+b.count,0),
  };

  return (
    <div className="container py-8 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin · Analytics (7 days)</h1>
          <p className="text-sm text-neutral-600">Pageviews, likes, saves.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/stories" className="text-sm underline">← Admin · Stories</Link>
        </div>
      </header>

      <section className="rounded-xl border bg-white/70 p-4">
        <div className="flex gap-6 text-sm">
          <div><span className="font-medium">Pageviews:</span> {totals.pageview}</div>
          <div><span className="font-medium">Likes:</span> {totals.like}</div>
          <div><span className="font-medium">Saves:</span> {totals.save}</div>
        </div>
      </section>

      <section className="rounded-xl border bg-white/70 overflow-hidden">
        <div className="px-4 py-3 font-medium bg-neutral-50 border-b">Daily events</div>
        <table className="w-full text-sm">
          <thead className="bg-neutral-50">
            <tr className="text-left">
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Pageviews</th>
              <th className="px-4 py-2">Likes</th>
              <th className="px-4 py-2">Saves</th>
            </tr>
          </thead>
          <tbody>
            {groupByDay(dailyRows).map(row => (
              <tr key={row.day} className="border-t">
                <td className="px-4 py-2">{row.day}</td>
                <td className="px-4 py-2">{row.pageview}</td>
                <td className="px-4 py-2">{row.like}</td>
                <td className="px-4 py-2">{row.save}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-xl border bg-white/70 overflow-hidden">
        <div className="px-4 py-3 font-medium bg-neutral-50 border-b">Top pages (pageviews)</div>
        <table className="w-full text-sm">
          <thead className="bg-neutral-50">
            <tr className="text-left">
              <th className="px-4 py-2">Path</th>
              <th className="px-4 py-2">Views</th>
            </tr>
          </thead>
          <tbody>
            {(top ?? []).map((t, i) => (
              <tr key={i} className="border-t">
                <td className="px-4 py-2">{t.path}</td>
                <td className="px-4 py-2">{(t as any).count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

async function getDailyFallback(): Promise<Row[]> {
  const { data } = await supabaseService.rpc("analytics_last_7_days");
  return (data ?? []) as Row[];
}

function groupByDay(rows: Row[]): { day: string; pageview: number; like: number; save: number }[] {
  const days = new Map<string, { pageview: number; like: number; save: number }>();
  for (const r of rows) {
    const key = r.day.slice(0, 10);
    if (!days.has(key)) days.set(key, { pageview: 0, like: 0, save: 0 });
    (days.get(key) as any)[r.kind] += r.count;
  }
  return Array.from(days.entries())
    .map(([day, v]) => ({ day, ...v }))
    .sort((a, b) => (a.day < b.day ? 1 : -1));
}
