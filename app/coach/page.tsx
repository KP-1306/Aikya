import { supabaseServer } from "@/lib/supabase/server";

export default async function CoachHome() {
  const sb = supabaseServer();
  const [{ data: { user } }, { data: prof }] = await Promise.all([
    sb.auth.getUser(),
    sb.from("karma_profiles").select("level,streak_days,total_points,state,city,interests").maybeSingle()
  ]);

  if (!user) {
    return (
      <div className="container max-w-2xl py-12">
        <h1 className="text-2xl font-bold mb-2">Aikya Karma Coach</h1>
        <p className="mb-4 text-neutral-600">Sign in to start your daily check-ins and build your streak.</p>
        <a className="btn-primary" href="/signin">Sign in</a>
      </div>
    );
  }

  const p = prof ?? { level: 1, streak_days: 0, total_points: 0, state: null, city: null, interests: [] };

  return (
    <div className="container max-w-2xl py-8 space-y-6">
      <header className="rounded-xl border bg-white/70 p-4">
        <div className="text-sm text-neutral-500">Level {p.level} • {p.total_points} pts • Streak {p.streak_days}🔥</div>
        <div className="text-sm text-neutral-600">Location: {p.city || p.state || "Set in profile"}</div>
        <div className="text-sm text-neutral-600">Interests: {(p.interests || []).join(", ") || "Add interests"}</div>
      </header>

      <div className="flex gap-3">
        <a className="btn-primary" href="/coach/checkin">Daily check-in</a>
        <a className="btn" href="/account">Edit profile</a>
        <a className="btn" href="/coach/goals">My goals</a>
      </div>
    </div>
  );
}
