// app/admin/(content)/acts/page.tsx
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Admin · Proof-of-Good" };

async function isAdmin(sb: ReturnType<typeof supabaseServer>) {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return false;
  const { data: profile } = await sb.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin";
}

export default async function AdminActs() {
  const sb = supabaseServer();
  if (!(await isAdmin(sb))) {
    return (
      <div className="container space-y-3">
        <h1 className="text-xl font-semibold">Not authorized</h1>
        <p className="text-sm text-neutral-600">Admin access required.</p>
        <Link href="/" className="underline text-sm">Go home</Link>
      </div>
    );
  }

  // We select "*" to be schema-tolerant; only render fields we find.
  const { data: acts, error } = await sb
    .from("good_acts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return (
      <div className="container">
        <p className="text-sm text-red-600">Failed to load acts: {error.message}</p>
      </div>
    );
  }

  const rows = acts ?? [];

  return (
    <div className="container space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Proof-of-Good™</h1>
        <p className="text-sm text-neutral-600">Manage acts and re-issue certificates (SVG uploaded to the <code>certificates</code> bucket with public URL saved back).</p>
      </header>

      {rows.length === 0 ? (
        <div className="text-sm text-neutral-500">No acts found.</div>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-md border">
          {rows.map((a: any) => (
            <li key={a.id} className="p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-medium">Act {a.id.slice(0,8)}… {a.title ? `· ${a.title}` : ""}</div>
                <div className="text-xs text-neutral-500">
                  {new Date(a.created_at).toLocaleString()} • user {a.user_id?.slice(0,8) ?? "—"}
                </div>
                {a.certificate_url ? (
                  <div className="text-xs">
                    <a href={a.certificate_url} target="_blank" className="underline">Certificate</a>
                  </div>
                ) : (
                  <div className="text-xs text-neutral-500">No certificate yet</div>
                )}
              </div>

              <form action="/api/admin/acts/reissue" method="POST">
                <input type="hidden" name="id" value={a.id} />
                <button className="btn" type="submit">Re-issue</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
