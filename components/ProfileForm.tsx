// components/ProfileForm.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Props = {
  initialFullName: string;
  initialState?: string | null;
  initialCity?: string | null;
  initialAvatarUrl?: string | null;
};

export default function ProfileForm({
  initialFullName,
  initialState = "",
  initialCity = "",
  initialAvatarUrl = "",
}: Props) {
  const [fullName, setFullName] = useState(initialFullName ?? "");
  const [state, setState] = useState(initialState ?? "");
  const [city, setCity] = useState(initialCity ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSaving(true);

    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      if (!user) throw new Error("Not signed in");

      const { error: upErr } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            full_name: fullName.trim(),
            state: state || null,
            city: city || null,
            avatar_url: avatarUrl || null,
          },
          { onConflict: "id" }
        );

      if (upErr) throw upErr;
      setNotice("Saved!");
    } catch (e: any) {
      setError(e?.message || "Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 text-red-700 px-3 py-2 text-sm">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-md bg-emerald-50 text-emerald-700 px-3 py-2 text-sm">
          {notice}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium">Full name</label>
        <input
          className="mt-1 w-full rounded-xl border px-3 py-2"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your name"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">State</label>
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="e.g., Karnataka"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">City</label>
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g., Bengaluru"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Avatar URL (optional)</label>
        <input
          className="mt-1 w-full rounded-xl border px-3 py-2"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://…"
        />
      </div>

      <button
        disabled={saving}
        className="btn-primary rounded-full px-4 py-2"
      >
        {saving ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
