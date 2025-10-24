// app/admin/stories/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import AdminPublishToggle from "@/components/AdminPublishToggle";
import AdminDeleteButton from "@/components/AdminDeleteButton";

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

  // Must be signed in
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/signin");

  // Must be admin
  const { data: admin } = await sb
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) redirect("/");

  // Thanks to your admin RLS policy, this returns drafts + published
  const { data, error } = await sb
    .from("stories")
    .select("id, slug, title, state, city, is_published, published_at, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Admin list fetch error:", error.message);
  }

  const rows = (data ?? []) as Row[];

  return (
    <div className="container py-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin · Stories</h1>
          <p className="text-sm text-neutral-600">
            Create, ingest, publish, edit, or delete stories. Only admins can see this page.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm underline hover:no-underline">
            ← Back to site
          </Link>
          <Link
            href="/admin/ingest"
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-neutral-50"
          >
            Ingest URL
          </Link>
          <Link
            href="/admin/stories/new"
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-neutral-50"
          >
            + New
          </Link>
        </div>
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
                  No stories yet. Click <em>+ New</em> or <em>Ingest URL</em> to create your first one.
                </td>
              </tr>
            )}

            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2">
                  <Link href={`/story/${r.slug}`} className="font-medium hover:underline">
                    {r.title}
                  </Link>
                  <div className="text-xs text-neutral-500">
                    Created: {new Date(r.created_at).toLocaleString()}
                  </div>
                </td>

                <td className="px-4 py-2">{r.city || r.state || "—"}</td>

                <td className="px-4 py-2">
                  {r.is_published ? (
                    <span className="rounded bg-emerald-100 text-emerald-700 px-2 py-0.5">
                      Published
                    </span>
                  ) : (
                    <span className="rounded bg-neutral-200 px-2 py-0.5">Draft</span>
                  )}
                </td>

                <td className="px-4 py-2">
                  {r.published_at ? new Date(r.published_at).toLocaleString() : "—"}
                </td>

                <td className="px-4 py-2">
                  <div className="flex items-center gap-3">
                    <AdminPublishToggle id={r.id} initial={r.is_published} />
                    <Link
                      href={`/admin/stories/${r.id}/edit`}
                      className="text-sm underline"
                    >
                      Edit
                    </Link>
                    <AdminDeleteButton id={r.id} title={r.title} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-neutral-500">
        Tip: Publishing sets <code>is_published</code> to <code>true</code> and updates{" "}
        <code>published_at</code>.
      </p>
    </div>
  );
}
