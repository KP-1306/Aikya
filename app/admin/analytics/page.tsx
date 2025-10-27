// app/admin/analytics/page.tsx
import { notFound, redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { trySupabaseService } from "@/lib/supabase/service";

type EventRow = {
  kind: "pageview" | "like" | "save";
  path: string | null;
  story_id: string | null;
  created_at: string;
  ua: string | null;
  referrer: string | null;
};

type TopRow = { key: string; count: number };

function aggregate<T extends string | null>(items: T[]): TopRow[] {
  const map = new Map<string, number>();
  for (const it of items) {
    const key = (it ?? "").trim();
    if (!key) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DAYS = 30;

export default async function AdminAnalyticsPage() {
  // ── Auth guard
  const sb = supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/signin");

  const { data: admin } = await sb
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) notFound();

  // ── Service client (required to read analytics_events)
  const svc = trySupabaseService(); // returns Supabase client or null
  if (!svc) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold">Admin · Analytics</h1>
        <p className="mt-4 text-sm text-neutral-600">
          Server is not configured with <code>SUPABASE_SERVICE_ROLE_KEY</code>. Add it to enable this
          page.
        </p>
      </div>
    );
  }

  // ── Load recent analytics events (last 30 days)
  const sinceIso = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000).toISOString();

  // ✅ IMPORTANT: call .from on the *client* (svc), not the function itself
  const { data: rows, error } = await svc
    .from("analytics_events")
    .select("kind, path, story_id, created_at, ua, referrer")
    .gte("created_at", sinceIso)
    .limit(50000); // safety cap

  if (error) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold">Admin · Analytics</h1>
        <p className="text-red-600 mt-4">Error: {error.message}</p>
      </div>
    );
  }

  const events = (rows ?? []) as EventRow[];

  // ── Aggregations
  const pageviews = events.filter((e) => e.kind === "pageview");
  const likes = events.filter((e) => e.kind === "like");
  const saves = events.filter((e) => e.kind === "save");

  const topPages: TopRow[] = aggregate(pageviews.map((e) => e.path)).slice(0, 20);
  const totalPV = pageviews.length;
  const totalLikes = likes.length;
  const totalSaves = saves.length;

  return (
    <div className="container py-8 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin · Analytics</h1>
          <p className="text-sm text-neutral-600">
            Aggregated from the last {DAYS} days of <code>analytics_events</code>.
          </p>
        </div>
      </header>

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-6">
          <div className="text-sm text-neutral-500">Pageviews</div>
          <div className="text-2xl font-bold">{totalPV.toLocaleString()}</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-neutral-500">Likes</div>
          <div className="text-2xl font-bold">{totalLikes.toLocaleString()}</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-neutral-500">Saves</div>
          <div className="text-2xl font-bold">{totalSaves.toLocaleString()}</div>
        </div>
      </div>

      {/* Top pages */}
      <div className="rounded-xl border bg-white/70 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50">
            <tr className="text-left">
              <th className="px-4 py-2">Path</th>
              <th className="px-4 py-2 w-32 text-right">Views</th>
            </tr>
          </thead>
          <tbody>
            {topPages.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-neutral-500">
                  No pageviews found for this window.
                </td>
              </tr>
            )}
            {topPages.map((r) => (
              <tr key={r.key} className="border-t">
                <td className="px-4 py-2">
                  <a className="underline" href={r.key} target="_blank" rel="noreferrer">
                    {r.key}
                  </a>
                </td>
                <td className="px-4 py-2 text-right">{r.count.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
