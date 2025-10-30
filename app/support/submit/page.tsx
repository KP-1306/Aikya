// app/support/submit/page.tsx
import { supabaseServer } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata = { title: "Submit Support Action – Aikya" };

const ACTIONS = [
  { key: "share", label: "Share a story" },
  { key: "volunteer", label: "Volunteer" },
  { key: "organize", label: "Organize" },
  { key: "mentor", label: "Mentor" },
  { key: "donate_non_cash", label: "Donate (non-cash)" },
];

export default async function SubmitSupport() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return (
      <div className="container space-y-4">
        <h1 className="text-xl font-semibold">Submit Support Action</h1>
        <p className="text-sm text-neutral-600">Please sign in to submit.</p>
        <Link className="btn" href="/auth/signin">Sign in</Link>
      </div>
    );
  }

  // Fetch a small list of published stories to choose from
  const { data: stories } = await sb
    .from("stories")
    .select("id, title, slug")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(50);

  return (
    <div className="container space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Submit a support action</h1>
        <p className="text-sm text-neutral-600">
          Pick a story, choose an action, and provide a short proof (URL and/or note).
        </p>
      </header>

      <form
        action="/api/support/submit"
        method="POST"
        className="card p-4 space-y-4 max-w-xl"
      >
        <div className="space-y-1">
          <label htmlFor="story_id" className="text-sm font-medium">Story</label>
          <select id="story_id" name="story_id" required className="input">
            <option value="">Select a story…</option>
            {(stories ?? []).map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="action_type" className="text-sm font-medium">Action type</label>
          <select id="action_type" name="action_type" required className="input">
            <option value="">Choose…</option>
            {ACTIONS.map((a) => (
              <option key={a.key} value={a.key}>{a.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="proof_url" className="text-sm font-medium">Proof URL (optional)</label>
          <input id="proof_url" name="proof_url" type="url" placeholder="https://…" className="input" />
        </div>

        <div className="space-y-1">
          <label htmlFor="proof_text" className="text-sm font-medium">Short note</label>
          <textarea id="proof_text" name="proof_text" rows={3} required className="input" placeholder="A sentence or two…" />
        </div>

        <div className="flex items-center gap-3">
          <button className="btn" type="submit">Submit</button>
          <Link href="/support" className="text-sm underline">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
