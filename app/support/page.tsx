// app/support/page.tsx
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = {
  title: "Support — Aikya",
  description: "Track your non-cash support actions and their status.",
};

const ACTIONS = [
  { key: "share", label: "Share a story", desc: "Spread the good—share on socials or groups." },
  { key: "volunteer", label: "Volunteer", desc: "Offer time/skills to an ongoing cause." },
  { key: "organize", label: "Organize", desc: "Host a small drive or community effort." },
  { key: "mentor", label: "Mentor", desc: "Guide someone with your expertise." },
  { key: "donate_non_cash", label: "Donate (non-cash)", desc: "Books, clothes, food, services, etc." },
];

export default async function SupportIndex() {
  const sb = supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    return (
      <main className="container py-10 space-y-4">
        <h1 className="text-2xl font-semibold">Support</h1>
        <p className="text-neutral-600">
          Sign in to see and submit your support actions.
        </p>
        <Link href="/signin" className="btn">Sign in</Link>
      </main>
    );
  }

  const { data, error } = await sb
    .from("support_actions")
    .select("id, title, status, city, state, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const myActions = data ?? [];

  return (
    <main className="container py-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Support Engine</h1>
        <p className="text-sm text-neutral-600">
          Small actions → big impact. Submit what you did; we’ll verify it. Approved actions earn a small Karma bump.
        </p>
      </header>

      {/* Suggestions */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">What you can do today</h2>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ACTIONS.map((a) => (
            <li key={a.key} className="rounded-xl border bg-white p-4">
              <h3 className="font-medium">{a.label}</h3>
              <p className="text-sm text-neutral-600">{a.desc}</p>
              <div className="mt-3">
                <Link href="/support/new" className="btn">Submit this</Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* My submissions */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">My submissions</h2>
          <Link href="/support/new" className="text-sm underline">
            New submission
          </Link>
        </div>

        {error ? (
          <div className="text-sm text-red-600">Failed to load: {error.message}</div>
        ) : myActions.length === 0 ? (
          <div className="text-sm text-neutral-500">
            No submissions yet. Start with a{" "}
            <Link href="/support/new" className="underline">
              new one
            </Link>
            .
          </div>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-md border bg-white">
            {myActions.map((row) => (
              <li key={row.id} className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">{row.title}</div>
                  <div className="text-xs text-neutral-500">
                    {(row.city || row.state)
                      ? [row.city, row.state].filter(Boolean).join(", ")
                      : "—"}{" "}
                    • {new Date(row.updated_at as any).toLocaleString()}
                  </div>
                </div>
                <span className="text-xs rounded-full bg-neutral-100 px-2 py-0.5 uppercase">
                  {row.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
