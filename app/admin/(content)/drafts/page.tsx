// app/admin/(content)/drafts/page.tsx
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Drafts" };

async function isAdmin(): Promise<boolean> {
  noStore(); // ensure no caching of auth
  const sb: any = supabaseServer(); // de-type to avoid .from() overload union issue

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return false;

  const { data: profile } = await sb
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return (profile?.role ?? null) === "admin";
}

export default async function AdminDrafts() {
  noStore();
  const sb: any = supabaseServer();

  const ok = await isAdmin();
  if (!ok) {
    return (
      <div className="container space-y-3 py-8">
        <h1 className="text-xl font-semibold">Not authorized</h1>
        <p className="text-sm text-neutral-600">Admin access required.</p>
        <Link href="/" className="underline text-sm">
          Go home
        </Link>
      </div>
    );
  }

  // Draft stories = not yet published
  const { data: drafts, error } = await sb
    .from("stories")
    .select("id, slug, title, state, city, created_at, is_published")
    .eq("is_published", false)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return (
      <div className="container py-8">
        <p className="text-sm text-red-600">
          Failed to load drafts: {error.message}
        </p>
        <Link href="/" className="underline text-sm">
          Go home
        </Link>
      </div>
    );
  }

  const rows = (drafts ?? []) as any[];

  return (
    <div className="container space-y-6 py-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Drafts</h1>
        <p className="text-sm text-neutral-600">
          These are stories not yet published. Publishing sets{" "}
          <code>is_published=true</code> and stamps <code>published_at</code>.
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="text-sm text-neutral-500">No drafts in queue.</div>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-md border">
          {rows.map((s) => (
            <li key={s.id} className="p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-medium">{s.title}</div>
                <div className="text-xs text-neutral-500">
                  {(s.city ?? s.state ?? "—") + " • "}
                  {s.created_at
                    ? `created ${new Date(s.created_at).toLocaleString()}`
                    : "created —"}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link href={`/story/${s.slug}`} className="underline text-sm">
                  Preview
                </Link>
                <form action="/api/admin/stories/publish" method="POST">
                  <input type="hidden" name="id" value={s.id} />
                  <button className="btn" type="submit">
                    Publish
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
