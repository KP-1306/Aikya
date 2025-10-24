// components/UpdateProfileForm.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

const IN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu","Delhi",
  "Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry"
];

export default function UpdateProfileForm({
  initialFullName,
  initialStateValue,
}: {
  initialFullName: string;
  initialStateValue: string;
}) {
  const [fullName, setFullName] = useState(initialFullName);
  const [stateVal, setStateVal] = useState(initialStateValue);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOk(null); setErr(null); setSaving(true);

    try {
      // get current user id
      const { data: { user }, error: uerr } = await supabase.auth.getUser();
      if (uerr) throw uerr;
      if (!user) throw new Error("Not signed in.");

      // upsert own profile (RLS policy allows this)
      const { error } = await supabase.from("profiles").upsert(
        { id: user.id, full_name: fullName.trim() || null, state: stateVal || null },
        { onConflict: "id" }
      );
      if (error) throw error;

      setOk("Profile updated.");
    } catch (e: any) {
      setErr(e?.message || "Could not update profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {ok && <div className="rounded-md bg-green-50 text-green-700 px-3 py-2 text-sm">{ok}</div>}
      {err && <div className="rounded-md bg-red-50 text-red-700 px-3 py-2 text-sm">{err}</div>}

      <div>
        <label className="block text-sm font-medium">Full name</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your name"
          className="mt-1 w-full rounded-xl border px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">State (for local news)</label>
        <select
          className="mt-1 w-full rounded-xl border px-3 py-2"
          value={stateVal}
          onChange={(e) => setStateVal(e.target.value)}
        >
          <option value="">— Select state/UT —</option>
          {IN_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <button disabled={saving} className="btn-primary">
          {saving ? "Saving…" : "Save changes"}
        </button>
        <span className="text-sm text-neutral-500">
          Changes update your local feed immediately.
        </span>
      </div>
    </form>
  );
}
