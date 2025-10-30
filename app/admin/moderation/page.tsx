// app/admin/moderation/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import ModerationTable from "@/components/ModerationTable";

export const metadata = {
  title: "Admin · Moderation — Aikya",
};

async function isAdmin() {
  const sb = supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false };

  // Prefer RPC if present
  try {
    const { data, error } = await sb.rpc("is_admin").single();
    if (!error && data === true) return { ok: true };
  } catch {
    /* ignore and fall back */
  }

  // Fallback to profiles.role
  const { data: prof } = await sb
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return { ok: prof?.role === "admin" };
}

export default async function ModerationPage() {
  const sb = supabaseServer();

  // Auth + Admin gate
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/signin");

  const { ok } = await isAdmin();
  if (!ok) redirect("/");

  // "Pending" = comments hidden by auto/moderation, awaiting review
  const { data: pendingRaw, error: pendErr } = await sb
    .from("comments")
    .select("id, story_id, user_id, body, created_at, status, flags")
    .eq("status", "hidden")
    .order("created_at", { ascending: false });

  // "Flagged" = flags > 0 (regardless of status, but usually visible)
  const { data: flaggedRaw, error: flagErr } = await sb
    .from("comments")
    .select("id, story_id, user_id, body, created_at, status, flags")
    .gt("flags", 0)
    .order("flags", { ascending: false })
    .order("created_at", { ascending: false });

  const pending = (pendingRaw ?? []).map((r: any) => ({
    ...r,
    flags_count: r.flags ?? 0,
  }));

  const flagged = (flaggedRaw ?? []).map((r: any) => ({
    ...r,
    flags_count: r.flags ?? 0,
  }));

  // If needed, you can surface errors:
  // (pendErr || flagErr) && console.error(pendErr?.message || flagErr?.message);

  return (
    <div className="container py-8 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin · Moderation</h1>
          <p className="text-sm text-neutral-600">
            Approve, hide, or ban users. Pending & flagged are prioritized.
          </p>
        </div>
        <Link href="/admin/stories" className="text-sm underline">
          ← Admin · Stories
        </Link>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Pending</h2>
        <ModerationTable rows={pending} emptyText="No pending comments." />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Flagged</h2>
        <ModerationTable rows={flagged} emptyText="No flagged comments." />
      </section>
    </div>
  );
}
