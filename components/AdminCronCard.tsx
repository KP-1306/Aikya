// components/AdminCronCard.tsx
"use client";

import { useEffect, useState } from "react";

type Status = {
  job: string;
  last_run: string | null;
  locked_until: string | null;
  day: string | null;
  daily_count: number;
  min_interval_min: number;
  next_due: string | null;
  max_daily: number;
  remaining_today: number;
};

export default function AdminCronCard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/cron/status", { cache: "no-store" });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Failed");
      setStatus(j);
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function unlock() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/cron/unlock", { method: "POST" });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.reason || j?.error || "Unlock failed");
      setMsg(j.cleared ? "Lock cleared." : "Lock still valid.");
      await load();
    } catch (e: any) {
      setMsg(e.message);
      setLoading(false);
    }
  }

  async function resetDaily() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/cron/reset", { method: "POST" });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Reset failed");
      setMsg("Daily counter reset.");
      await load();
    } catch (e: any) {
      setMsg(e.message);
      setLoading(false);
    }
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Embeddings Job</h3>
        <button className="btn btn-sm" onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {msg && <div className="text-sm text-neutral-600">{msg}</div>}

      {!status ? (
        <div className="text-sm text-neutral-500">Loading…</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div>
            <div className="text-neutral-500">Last run</div>
            <div>{status.last_run ? new Date(status.last_run).toLocaleString() : "—"}</div>
          </div>
          <div>
            <div className="text-neutral-500">Next due</div>
            <div>{status.next_due ? new Date(status.next_due).toLocaleString() : "—"}</div>
          </div>
          <div>
            <div className="text-neutral-500">Locked until</div>
            <div>{status.locked_until ? new Date(status.locked_until).toLocaleString() : "—"}</div>
          </div>
          <div>
            <div className="text-neutral-500">Daily progress</div>
            <div>
              {status.daily_count} / {status.max_daily} &nbsp;
              <span className="text-neutral-500">({status.remaining_today} left)</span>
            </div>
          </div>
          <div>
            <div className="text-neutral-500">Min interval</div>
            <div>{status.min_interval_min} minutes</div>
          </div>
          <div>
            <div className="text-neutral-500">Window day</div>
            <div>{status.day ?? "—"}</div>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button className="btn btn-sm" onClick={unlock} disabled={loading}>
          Force Unlock (safe)
        </button>
        <button className="btn btn-sm" onClick={resetDaily} disabled={loading}>
          Reset Daily Counter
        </button>
      </div>
    </div>
  );
}
