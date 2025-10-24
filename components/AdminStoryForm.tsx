"use client";

import { useState } from "react";
import ImageUploader from "./ImageUploader";

type StoryDraft = {
  id?: string;
  title: string;
  dek: string;
  category: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  what: string;
  how: string;
  why: string;
  life_lesson: string;
  read_minutes?: number | null;
  hero_image?: string | null;
  hero_alt?: string | null;
  hero_credit?: string | null;
  is_published?: boolean;
};

export default function AdminStoryForm({
  initial,
}: { initial?: Partial<StoryDraft> }) {
  const [data, setData] = useState<StoryDraft>({
    title: "",
    dek: "",
    category: "ActsOfKindness",
    city: "",
    state: "",
    country: "IN",
    what: "",
    how: "",
    why: "",
    life_lesson: "",
    read_minutes: 3,
    hero_image: null,
    hero_alt: "",
    hero_credit: "",
    is_published: false,
    ...initial,
  });

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function onText<K extends keyof StoryDraft>(k: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setData(d => ({ ...d, [k]: e.target.value }));
  }

  async function submit(publish: boolean) {
    setBusy(true); setErr(null); setMsg(null);
    try {
      const res = await fetch("/api/admin/stories/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, is_published: publish }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      setMsg(publish ? "Published!" : "Draft saved.");
      if (j.slug) window.location.href = `/story/${j.slug}`;
    } catch (e: any) {
      setErr(e?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="space-y-5">
      {err && <div className="rounded bg-red-50 px-3 py-2 text-red-700 text-sm">{err}</div>}
      {msg && <div className="rounded bg-green-50 px-3 py-2 text-green-700 text-sm">{msg}</div>}

      <div>
        <label className="block text-sm font-medium">Title</label>
        <input className="mt-1 w-full rounded border px-3 py-2"
          value={data.title} onChange={onText("title")} />
      </div>

      <div>
        <label className="block text-sm font-medium">Dek (subheadline)</label>
        <input className="mt-1 w-full rounded border px-3 py-2"
          value={data.dek} onChange={onText("dek")} />
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium">Category</label>
          <select className="mt-1 w-full rounded border px-3 py-2"
            value={data.category} onChange={onText("category")}>
            <option>ActsOfKindness</option>
            <option>BraveryRescue</option>
            <option>Innovation</option>
            <option>Environment</option>
            <option>GlobalHope</option>
            <option>Wisdom</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">City</label>
          <input className="mt-1 w-full rounded border px-3 py-2"
            value={data.city ?? ""} onChange={onText("city")} />
        </div>
        <div>
          <label className="block text-sm font-medium">State</label>
          <input className="mt-1 w-full rounded border px-3 py-2"
            value={data.state ?? ""} onChange={onText("state")} />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium">Country</label>
          <input className="mt-1 w-full rounded border px-3 py-2"
            value={data.country ?? ""} onChange={onText("country")} />
        </div>
        <div>
          <label className="block text-sm font-medium">Read minutes</label>
          <input type="number" min={1} className="mt-1 w-full rounded border px-3 py-2"
            value={data.read_minutes ?? 3}
            onChange={(e) => setData(d => ({ ...d, read_minutes: Number(e.target.value) || 3 }))}/>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <ImageUploader
          value={data.hero_image ?? null}
          onChange={(url) => setData(d => ({ ...d, hero_image: url }))}
          label="Hero image"
        />
        <div>
          <label className="block text-sm font-medium">Hero alt text</label>
          <input className="mt-1 w-full rounded border px-3 py-2"
            value={data.hero_alt ?? ""} onChange={onText("hero_alt")} />
        </div>
        <div>
          <label className="block text-sm font-medium">Image credit</label>
          <input className="mt-1 w-full rounded border px-3 py-2"
            value={data.hero_credit ?? ""} onChange={onText("hero_credit")} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">What happened</label>
        <textarea rows={4} className="mt-1 w-full rounded border px-3 py-2"
          value={data.what} onChange={onText("what")} />
      </div>
      <div>
        <label className="block text-sm font-medium">How they acted</label>
        <textarea rows={4} className="mt-1 w-full rounded border px-3 py-2"
          value={data.how} onChange={onText("how")} />
      </div>
      <div>
        <label className="block text-sm font-medium">Why it matters</label>
        <textarea rows={4} className="mt-1 w-full rounded border px-3 py-2"
          value={data.why} onChange={onText("why")} />
      </div>
      <div>
        <label className="block text-sm font-medium">Life lesson</label>
        <input className="mt-1 w-full rounded border px-3 py-2"
          value={data.life_lesson} onChange={onText("life_lesson")} />
      </div>

      <div className="flex gap-3">
        <button type="button" className="btn border px-4 py-2" disabled={busy}
          onClick={() => submit(false)}>Save draft</button>
        <button type="button" className="btn bg-brand text-white px-4 py-2" disabled={busy}
          onClick={() => submit(true)}>Publish</button>
      </div>
    </form>
  );
}
