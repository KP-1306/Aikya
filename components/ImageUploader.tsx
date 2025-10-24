"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function ImageUploader({
  value,
  onChange,
  label = "Hero image",
}: {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setErr(null);
    try {
      // Ensure user is logged in (admin page already requires it)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const key = `admin/${user.id}/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
      const { error } = await supabase.storage
        .from("story-images")
        .upload(key, file, { upsert: false, cacheControl: "3600" });
      if (error) throw error;

      const { data } = supabase.storage.from("story-images").getPublicUrl(key);
      onChange(data.publicUrl);
    } catch (e: any) {
      setErr(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      {value && (
        <img src={value} alt="" className="h-28 w-full object-cover rounded border" />
      )}
      <div className="flex gap-2">
        <input type="file" accept="image/*" onChange={onFile} disabled={busy} />
        {value && (
          <button type="button" className="btn border px-3 py-1.5 text-sm"
            onClick={() => onChange(null)} disabled={busy}>
            Remove
          </button>
        )}
      </div>
      {busy && <div className="text-xs text-neutral-500">Uploading…</div>}
      {err && <div className="text-xs text-red-600">{err}</div>}
    </div>
  );
}
