// app/admin/analytics/page.tsx
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin · Analytics — Aikya",
  description: "Quick engagement and reach snapshots.",
};

export default async function AdminAnalyticsPage() {
  await assertAdminOrOwner();

  const sb: any = supabaseServer(); // TS-safe cast for Netlify

  // Basic KPIs with wide try/catch so missing tables don't break builds
  let totalStories = 0;
  let totalPublished = 0;
  let totalComments = 0;
  let totalActs = 0;
  let lastStoryAt: string | null = null;

  try {
    // stories
    const { count: storiesCount } = await sb
      .from("stories")
      .select("id", { count: "exact", head: true });
    totalStories = storiesCount ?? 0;

    const { count: publishedCount } = await sb
      .from("stories")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true);
    totalPublished = publishedCount ?? 0;

    const { data: lastStory } = await sb
      .from("stories")
      .select("published_at, created_at")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(1);
    lastStoryAt =
      (lastStory?.[0]?.published_at as string | null) ??
      (lastStory?.[0]?.created_at as string | null) ??
      null;
  } catch {
    // ignore
  }

  try {
    // comments (optional table)
    const { count: commentsCount } = await sb
      .from("comments")
      .select("id", { count: "exact", head: true });
    totalComments = commentsCount ?? 0;
  } catch {
    // ignore if table absent
  }

  try {
    // good_acts (optional table)
    const { count: actsCount } = await sb
      .from("good_acts")
      .select("id", { count: "exact", head: true });
    totalActs = actsCount ?? 0;
  } catch {
    // ignore if table absent
  }

  // Simple timeframe snapshot (last 7 days)
  const since = new Date(Date.now() - 7 * 864e5).toISOString();
  let newStories7d = 0;
  let newComments7d = 0;
  let likes7d = 0;

  try {
    const { count } = await sb
      .from("stories")
      .select("id", { count: "exact", head: true })
      .gte("published_at", since)
      .eq("is_published", true);
    newStories7d = count ?? 0;
  } catch {}

  try {
    const { count } = await sb
      .from("comments")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since);
    newComments7d = count ?? 0;
  } catch {}

  try {
    // If you track likes on stories.like_count, sum recent ones
    const { data } = await sb
      .from("stories")
      .select("like_count")
      .gte("published_at", since)
      .eq("is_published", true);
    likes7d = (data ?? []).reduce(
      (s: number, r: any) => s + (Number(r.like_count ?? 0) || 0),
      0
    );
  } catch {}

  return (
    <div className="container py-8 space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-neutral-600">
          High-level engagement & reach. (Schema-tolerant; missing tables are skipped.)
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label="Stories (total)" value={totalStories} />
        <KPI label="Published" value={totalPublished} />
        <KPI label="Comments" value={totalComments} />
        <KPI label="Good Acts" value={totalActs} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPI label="Stories in last 7d" value={newStories7d} />
        <KPI label="Comments in last 7d" value={newComments7d} />
        <KPI label="Likes (stories) last 7d" value={likes7d} />
      </section>

      <section>
        <div className="card p-4">
          <div className="text-sm text-neutral-600">Last story activity</div>
          <div className="text-lg font-semibold">
            {lastStoryAt ? new Date(lastStoryAt).toLocaleString() : "—"}
          </div>
        </div>
      </section>
    </div>
  );
}

/** Tiny KPI card */
function KPI({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card p-4">
      <div className="text-sm text-neutral-600">{label}</div>
      <div className="text-2xl font-semibold">{String(value)}</div>
    </div>
  );
}

/**
 * Admin/Owner guard:
 * - Try RPC is_admin(); tolerate different return shapes
 * - Fallback to admins table, user_profiles, profiles
 * - Redirect to /signin when unauthorized
 */
async function assertAdminOrOwner() {
  const sb: any = supabaseServer(); // cast prevents union-callable TS error

  const { data: userRes } = await sb.auth.getUser();
  const user = userRes?.user;
  if (!user) redirect("/signin");

  // 1) RPC
  try {
    const { data: rpcData } = await sb.rpc("is_admin");
    const rpcBool =
      rpcData === true ||
      rpcData === "t" ||
      (rpcData && typeof rpcData === "object" && (rpcData.is_admin === true || rpcData.is_admin === "t"));
    if (rpcBool) return;
  } catch {}

  // 2) admins table (optional)
  try {
    const { data: admin } = await sb
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (admin?.user_id) return;
  } catch {}

  // 3) user_profiles → profiles fallback
  let role: string | null = null;
  try {
    const up = await sb
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (!up?.error && up?.data) role = (up.data as any).role ?? null;
  } catch {}

  if (!role) {
    try {
      const pf = await sb
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (!pf?.error && pf?.data) role = (pf.data as any).role ?? null;
    } catch {}
  }

  if (role === "admin" || role === "owner") return;

  redirect("/signin?error=not_authorized");
}
