// app/support/page.tsx
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Support – Aikya" };

const ACTIONS = [
  { key: "share", label: "Share a story", desc: "Spread the good—share on socials or groups." },
  { key: "volunteer", label: "Volunteer", desc: "Offer time/skills to an ongoing cause." },
  { key: "organize", label: "Organize", desc: "Host a small drive or community effort." },
  { key: "mentor", label: "Mentor", desc: "Guide someone with your expertise." },
  { key: "donate_non_cash", label: "Donate (non-cash)", desc: "Books, clothes, food, services, etc." },
];

export default async function SupportHub() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();

  let mySubs: any[] = [];
  if (user?.id) {
    const { data } = await sb
      .from("support_actions")
      .select("id, action_type, status, created_at, story:stories!inner(slug,title)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    mySubs = data || [];
  }

  return (
    <div className="container space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Support Engine</h1>
        <p className="text-sm text-neutral-600">
          Small actions → big impact. Pick an action, submit proof, and we’ll verify it.
          Approved actions earn a small Karma bump.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">What you can do today</h2>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ACTIONS.map((a) => (
            <li key={a.key} className="card p-4">
              <h3 className="font-medium">{a.label}</h3>
              <p className="text-sm text-neutral-600">{a.desc}</p>
              <div className="mt-3">
                <Link href="/support/submit" className="btn">Submit this</Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">My submissions</h2>
          <Link href="/support/submit" className="text-sm underline">New submission</Link>
        </div>

        {mySubs.length === 0 ? (
          <div className="text-sm text-neutral-500">
            No submissions yet. Start with a <Link href="/support/submit" className="underline">new one</Link>.
          </div>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-md border">
            {mySubs.map((s) => (
              <li key={s.id} className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm">
                    <span className="font-medium capitalize">{s.action_type.replaceAll("_", " ")}</span>{" "}
                    on <Link className="underline" href={`/story/${s.story.slug}`}>{s.story.title}</Link>
                  </div>
                  <div className="text-xs text-neutral-500">
                    {new Date(s.created_at).toLocaleString()} • Status: <span className="uppercase">{s.status}</span>
                  </div>
                </div>
                {/* Admin review link visible to admins only in verify page; here we just show status */}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
