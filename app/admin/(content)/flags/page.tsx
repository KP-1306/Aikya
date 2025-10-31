// app/admin/(content)/flags/page.tsx
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Admin · Flags" };
export const dynamic = "force-dynamic";

/** Centralized, safe admin check (no union types; uses maybeSingle) */
async function isAdmin(): Promise<boolean> {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return false;

  const { data: profile } = await sb
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle(); // avoid .single() overload issues

  return profile?.role === "admin";
}

export default async function AdminFlags() {
  // Gate early (don’t construct heavy queries if not admin)
  if (!(await isAdmin())) {
    return (
      <div className="container space-y-3">
        <h1 className="text-xl font-semibold">Not authorized</h1>
        <p className="text-sm text-neutral-600">Admin access required.</p>
        <Link href="/" className="underline text-sm">Go home</Link>
      </div>
    );
  }

  const sb = supabaseServer();

  // Pull flagged comments. The join alias is kept schema-tolerant.
  const { data: comments, error } = await sb
    .from("comments")
    .select(`
      id,
      body,
      created_at,
      user_id,
      story_id,
      is_flagged,
      flags_count,
      status,
      story:stories (
        slug,
        title
      )
    `)
    .or("is_flagged.eq.true,flags_count.gt.0")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return (
      <div className="container">
        <p className="text-sm text-red-600">
          Failed to load flagged comments: {error.message}
        </p>
      </div>
    );
  }

  const rows = comments ?? [];

  return (
    <div className="container space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Flagged comments</h1>
        <p className="text-sm text-neutral-600">
          Review and take quick actions. Approve clears flags. Hide removes from public
          view. Ban blocks future posting (if your schema supports it).
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="text-sm text-neutral-500">No flagged comments. 🎉</div>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-md border">
          {rows.map((c: any) => (
            <li key={c.id} className="p-4 space-y-2">
              <div className="text-sm">
                <span className="font-medium">Story:</span>{" "}
                {c.story?.slug ? (
                  <Link href={`/story/${c.story.slug}`} className="underline">
                    {c.story?.title ?? c.story?.slug}
                  </Link>
                ) : (
                  <span className="text-neutral-500">unknown</span>
                )}
              </div>

              <div className="text-sm whitespace-pre-wrap">{c.body}</div>

              <div className="text-xs text-neutral-500">
                {new Date(c.created_at).toLocaleString()} • user{" "}
                {c.user_id ? `${String(c.user_id).slice(0, 8)}…` : "—"} • status:{" "}
                {c.status ?? "—"} • flags: {c.flags_count ?? (c.is_flagged ? 1 : 0)}
              </div>

              <div className="flex items-center gap-3">
                <form action="/api/admin/comments/moderate" method="POST">
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="action" value="approve" />
                  <button className="btn" type="submit">Approve</button>
                </form>

                <form action="/api/admin/comments/moderate" method="POST">
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="action" value="hide" />
                  <button className="btn-secondary" type="submit">Hide</button>
                </form>

                <form action="/api/admin/comments/moderate" method="POST">
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="action" value="ban_user" />
                  <button className="btn-danger" type="submit">Ban user</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
