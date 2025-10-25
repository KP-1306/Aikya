import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import ModerationTable from "@/components/ModerationTable";

export default async function ModerationPage() {
  const sb = supabaseServer();

  // Auth + admin
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/signin");
  const { data: admin } = await sb.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) redirect("/");

  // Load pending & flagged (admins can read all due to policy)
  const { data: pending } = await sb
    .from("comments")
    .select("id, story_id, user_id, body, created_at, status, flags_count")
    .in("status", ["pending"])
    .order("created_at", { ascending: false });

  const { data: flagged } = await sb
    .from("comments")
    .select("id, story_id, user_id, body, created_at, status, flags_count")
    .in("status", ["flagged"])
    .order("flags_count", { ascending: false });

  return (
    <div className="container py-8 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin · Moderation</h1>
          <p className="text-sm text-neutral-600">Approve, hide, or ban users. Pending & flagged are prioritized.</p>
        </div>
        <Link href="/admin/stories" className="text-sm underline">← Admin · Stories</Link>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Pending</h2>
        <ModerationTable rows={pending ?? []} emptyText="No pending comments." />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Flagged</h2>
        <ModerationTable rows={flagged ?? []} emptyText="No flagged comments." />
      </section>
    </div>
  );
}
