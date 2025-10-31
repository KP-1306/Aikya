"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  initialCity?: string | null;
  initialState?: string | null;
};

export default function RegionPicker({ initialCity, initialState }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState(initialCity ?? "");
  const [state, setState] = useState(initialState ?? "");
  const [saving, setSaving] = useState(false);
  const label =
    city && state ? `${city}, ${state}` :
    city ? city :
    state ? state :
    "Set location";

  async function save() {
    setSaving(true);
    const res = await fetch("/api/profile/region", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city, state }),
    });
    setSaving(false);
    if (res.ok) {
      setOpen(false);
      router.refresh(); // refresh server components that depend on profile
    } else {
      const j = await res.json().catch(() => ({}));
      alert(j?.error || "Could not save location");
    }
  }

  return (
    <div className="relative">
      <button
        className="btn !py-2 !px-3"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {label}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-neutral-200 bg-white p-3 shadow-lg"
        >
          <div className="space-y-2">
            <div>
              <label className="text-xs text-neutral-600">City</label>
              <input
                className="input w-full"
                placeholder="e.g., Haldwani"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-neutral-600">State</label>
              <input
                className="input w-full"
                placeholder="e.g., Uttarakhand"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button className="text-sm text-neutral-600" type="button" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className="btn" type="button" onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
            <p className="text-[11px] text-neutral-500">
              Tip: Choose <b>City</b> or <b>State</b> above in the feed to filter by what you set here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
