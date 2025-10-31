// app/admin/moderation/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import ModerationTable from "@/components/ModerationTable";

export const metadata = {
  title: "Admin · Moderation — Aikya",
};

async function isAdmin() {
  const sb: any = supabaseServer(); // cast avoids “.from is not callable” union issue on Netlify
  const { data: userRes } = await sb.auth.getUser();
  const user = userRes?.user;
  if (!user) return { ok: false };

  // Prefer RPC if present (tolerate different shapes)
  try {
    const { data: rpcData } = await sb.rpc("is_admin");
    const rpcBool =
      rpcData === true ||
      rpcData === "t" ||
      (rpcData && typeof rpcData === "object" && (rpcData.is_admin === true || rpcData.is_admin === "t"));
    if (rpcBool) return { ok: true };
  } catch {
    /* ignore */
  }

  // Fallback to profiles.role (or user_profiles.role if you prefer)
  try {
    const { data: prof } = await sb
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    return { ok: prof?.role === "admin" || prof?.role === "owner" };
  } catch {
    return { ok: false };
  }
}

export default async function ModerationPage() {
  const sb: any = supabaseServer();

  // Auth + Admin gate
  const { data: userRes } = await sb.auth.getUser();
  const user = userRes?.user;
  if (!user) redirect("/signin");

  const { ok } = await isAdmin();
  if (!ok) redirect("/");

  // Pending: comments hidden by moderation awaiting review
  let pendingRaw: any[] | null = null;
  try {
    const { data } = await sb
      .from("comments")
      .select("id, story_id, user_id, body, created_at, status, flags")
      .eq("status", "hidden")
      .order("created_at", { ascending: false });
    pendingRaw = data ?? [];
  } catch {
    pendingRaw = [];
  }

  // Flagged: flags > 0 (tolerate missing 'flags' by defaulting to 0)
  let flaggedRaw: any[] | null = null;
  try {
    const { data } = await sb
      .from("comments")
      .select("id, story_id, user_id, body, created_at, status, flags")
      .gt("flags", 0)
      .order("flags", { ascending: false })
      .order("created_at", { ascending: false });
    flaggedRaw = data ?? [];
  } catch {
    flaggedRaw = [];
  }

  const pending = (pendingRaw ?? []).map((r: any) => ({
    ...r,
    flags_count: r.flags ?? 0,
  }));

  const flagged = (flaggedRaw ?? []).map((r: any) => ({
    ...r,
    flags_count: r.flags ?? 0,
  }));

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
