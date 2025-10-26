// app/coach/checkin/page.tsx
import Link from "next/link";

type CheckinOK = {
  date: string;         // ISO date for the last check-in
  streak: number;       // current streak in days
  // you can add more fields later (e.g., score, today, etc.)
};

type CheckinResp = CheckinOK | { error: string };

export const dynamic = "force-dynamic";

async function getCheckin(): Promise<CheckinResp> {
  // Use a relative URL; disable caching for always-fresh data
  const res = await fetch("/api/coach/checkin", { cache: "no-store" });
  try {
    return (await res.json()) as CheckinResp;
  } catch {
    return { error: "Unable to parse server response." };
  }
}

export default async function CoachCheckinPage() {
  const data = await getCheckin();

  const isError = "error" in data;
  const date = !isError ? data.date : null;
  const streak = !isError ? data.streak : 0;

  return (
    <div className="container max-w-2xl py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Aikya Karma Coach</h1>
        <p className="text-sm text-neutral-600">
          Build a daily habit of small, positive actions.
        </p>
      </header>

      {/* Status card */}
      <div className="space-y-4">
        <div className="rounded-xl border bg-white/70 p-4">
          {isError ? (
            <div className="text-sm text-red-600">
              {data.error || "Something went wrong."}
            </div>
          ) : (
            <>
              <div className="text-sm text-neutral-500">
                Date: {date}
              </div>
              <div className="text-sm text-neutral-600">
                Streak: {streak} days 🔥
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="rounded-xl border bg-white/70 p-4">
          <div className="text-sm text-neutral-700">
            Keep the streak going by checking in once a day.
          </div>
          <div className="mt-3 flex gap-2">
            <Link
              href="/coach/checkin/new"
              className="rounded-full bg-brand text-white px-4 py-2 text-sm"
            >
              Check in now
            </Link>
            <Link
              href="/coach/history"
              className="rounded-full border px-4 py-2 text-sm hover:bg-neutral-50"
            >
              View history
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
