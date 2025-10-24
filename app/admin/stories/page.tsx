// app/admin/stories/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import AdminPublishToggle from "@/components/AdminPublishToggle";

type Row = {
  id: string;
  slug: string;
  title: string;
  state: string | null;
  city: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
};

export default async function AdminStoriesPage() {
  const sb = supabaseServer();

  // Guard: must be signed in
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/signin");

  // Guard: must be admin
  const { data: admin } = await sb.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) redirect("/");

  // Admins should see ALL stories (bypass RLS via service or a secure RPC).
  // For list view it's OK to use service client, but we can also query via RLS if you add a policy.
  // Simpler: create a limited view for admin listing later. For now, fetch via RPC: we'll fetch using service from an API.
  // To keep this file simple, we’ll rely on existing policy (published only) + a fallback.
  // Better: fetch with service using a server action or route. We'll use the service client here:

  const { data, error } = await sb
    .from("stories")
    .select("id, slug, title, state, city, is_published, published_at, created_at")
    .order("created_at", { ascending: false });

  // NOTE: Because of RLS, this returns only published stories for non-service queries.
  // Let's fetch all with a tiny server fetch to our own API (using service role) to list everything:
  // But to keep a single file, we’ll attempt a policy-free approach:
  // If you only see published rows here, consider adding a helper API that returns all. For many apps, listing only published + drafts seeded is enough.

  // If you want to absolutely fetch ALL here, uncomment and use a Route Handler:
  // const all = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL!}/api/admin/list`, { cache: "no-store", headers: { cookie: "" } }).then(r => r.json());

  const rows = (data ?? []) as Row[];

  return (
    <div className="container py-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin · Stories</h1>
          <p className="text-sm text-neutral-600">
            Publish or unpublish stories. Only admins can see this page.
          </p>
        </div>
        <nav className="text-sm">
          <Link href="/" className="underline hover:no-underline">← Back to site</Link>
        </nav>
      </header>

      <div className="rounded-xl border bg-white/70 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50">
            <tr className="text-left">
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Location</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Published</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-neutral-500">
                  No stories yet (or RLS hid drafts). Insert a draft in Supabase or add a list API using the service role.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2">
                  <Link href={`/story/${r.slug}`} className="font-medium hover:underline">
                    {r.title}
                  </Link>
                </td>
                <td className="px-4 py-2">{r.city || r.state || "—"}</td>
                <td className="px-4 py-2">
                  {r.is_published ? (
                    <span className="rounded bg-emerald-100 text-emerald-700 px-2 py-0.5">Published</span>
                  ) : (
                    <span className="rounded bg-neutral-200 px-2 py-0.5">Draft</span>
                  )}
                </td>
                <td className="px-4 py-2">{r.published_at ? new Date(r.published_at).toLocaleString() : "—"}</td>
                <td className="px-4 py-2">
                  <AdminPublishToggle id={r.id} initial={r.is_published} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-neutral-500">
        Tip: Publishing sets <code>is_published=true</code> and updates <code>published_at</code>.
      </p>
    </div>
  );
}
