import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

type Row = {
  id: string;
  story_id: string;
  level: number;
  status: "under_review" | "verified" | "rejected";
  note: string | null;
  created_at: string;
  certificate_url: string | null;
  story: { slug: string; title: string } | null;
  proofs: { id: number; kind: string; url: string | null; note: string | null }[];
};

async function fetchRows() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/signin");
  const { data: admin } = await sb.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) redirect("/");

  // minimal join via multiple queries to keep it simple
  const { data: acts } = await sb
    .from("good_acts")
    .select("id, story_id, level, status, note, created_at, certificate_url")
    .order("created_at", { ascending: false });

  const rows: Row[] = [];
  if (!acts) return rows;

  for (const a of acts) {
    const [{ data: story }] = await Promise.all([
      sb.from("stories").select("slug,title").eq("id", a.story_id).maybeSingle()
    ]);
    const { data: proofs } = await sb
      .from("good_proofs")
      .select("id, kind, url, note")
      .eq("act_id", a.id)
      .order("id", { ascending: true });

    rows.push({
      ...a,
      story: story ?? null,
      proofs: proofs ?? []
    } as Row);
  }
  return rows;
}

export default async function AdminActsPage() {
  const rows = await fetchRows();

  return (
    <div className="container py-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin · Proof-of-Good</h1>
          <p className="text-sm text-neutral-600">Review submissions, verify, and issue rewards.</p>
        </div>
        <nav className="text-sm">
          <Link href="/admin/stories" className="underline hover:no-underline">Stories</Link>
        </nav>
      </header>

      <div className="rounded-xl border bg-white/70 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50">
            <tr className="text-left">
              <th className="px-4 py-2">Story</th>
              <th className="px-4 py-2">Level</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Proofs</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-neutral-500">No submissions yet.</td></tr>
            )}
            {rows.map(r => (
              <tr key={r.id} className="border-t align-top">
                <td className="px-4 py-2">
                  {r.story ? (
                    <Link href={`/story/${r.story.slug}`} className="font-medium hover:underline">
                      {r.story.title}
                    </Link>
                  ) : <span className="text-neutral-500">—</span>}
                  <div className="text-xs text-neutral-500">{new Date(r.created_at).toLocaleString()}</div>
                  {r.note && <div className="text-xs mt-1">{r.note}</div>}
                </td>
                <td className="px-4 py-2">L{r.level}</td>
                <td className="px-4 py-2">
                  <span className="rounded px-2 py-0.5 bg-neutral-200">{r.status}</span>
                  {r.certificate_url && (
                    <div className="text-xs mt-1">
                      <a className="underline" href={r.certificate_url} target="_blank">Certificate</a>
                    </div>
                  )}
                </td>
                <td className="px-4 py-2">
                  <ul className="space-y-1">
                    {r.proofs.map(p => (
                      <li key={p.id}>
                        <span className="rounded bg-neutral-100 px-2 py-0.5">{p.kind}</span>
                        {p.url && <> · <a className="underline" href={p.url} target="_blank" rel="noreferrer">link</a></>}
                        {p.note && <div className="text-xs text-neutral-600">{p.note}</div>}
                      </li>
                    ))}
                    {r.proofs.length === 0 && <span className="text-neutral-500">—</span>}
                  </ul>
                </td>
                <td className="px-4 py-2 space-y-2">
                  <form action="/api/acts/verify" method="post">
                    <input type="hidden" name="actId" value={r.id} />
                    <input type="hidden" name="verdict" value="confirm" />
                    <button
                      formAction="/api/acts/verify"
                      className="btn btn-sm">Confirm</button>
                  </form>
                  <form action="/api/acts/verify" method="post">
                    <input type="hidden" name="actId" value={r.id} />
                    <input type="hidden" name="verdict" value="deny" />
                    <button className="btn btn-sm">Reject</button>
                  </form>
                  <form action="/api/acts/cert/issue" method="post">
                    <input type="hidden" name="actId" value={r.id} />
                    <input type="hidden" name="issueYT" value={String(r.level <= 2)} />
                    <button className="btn btn-sm" disabled={r.status !== "verified"}>
                      Issue Certificate{r.level <= 2 ? " + YT" : ""}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-neutral-500">
        Rule: Level ≤ 2 acts may be queued for a YouTube animation reward.
      </p>
    </div>
  );
}
