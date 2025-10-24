"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Draft = {
  title: string; dek: string;
  what: string; how: string; why: string; life_lesson: string;
  category?: string;
  city?: string | null; state?: string | null; country?: string | null;
  read_minutes?: number | null;
  hero_image?: string | null; hero_alt?: string | null; hero_credit?: string | null;
  sources?: { name: string; url: string }[];
};

export default function AdminIngestClient() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const router = useRouter();

  async function fetchDraft() {
    setBusy(true); setError(null); setDraft(null);
    try {
      const res = await fetch("/api/admin/ingest/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to generate draft");
      setDraft(j.draft);
    } catch (e:any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function useInEditor() {
    if (!draft) return;
    // make the draft available to the /admin/stories/new client form
    sessionStorage.setItem("ingestDraft", JSON.stringify(draft));
    router.push("/admin/stories/new");
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="url"
          placeholder="https://example.com/good-news"
          className="flex-1 rounded border px-3 py-2"
          value={url}
          onChange={(e)=>setUrl(e.target.value)}
        />
        <button className="btn border px-4 py-2" onClick={fetchDraft} disabled={busy || !url}>
          {busy ? "Fetching…" : "Fetch & Draft"}
        </button>
      </div>

      {error && <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}

      {draft && (
        <div className="rounded-xl border p-4 space-y-3 bg-white/70">
          <h3 className="text-lg font-semibold">{draft.title}</h3>
          <p className="text-neutral-700">{draft.dek}</p>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div><div className="font-medium">What happened</div><p>{draft.what}</p></div>
            <div><div className="font-medium">How they acted</div><p>{draft.how}</p></div>
            <div><div className="font-medium">Why it matters</div><p>{draft.why}</p></div>
          </div>
          <div className="text-sm"><span className="font-medium">Life lesson:</span> {draft.life_lesson}</div>
          {draft.sources?.length ? (
            <div className="text-sm">
              <div className="font-medium">Sources:</div>
              <ul className="list-disc pl-5">
                {draft.sources.map((s) => <li key={s.url}><a className="underline" href={s.url} target="_blank">{s.name || s.url}</a></li>)}
              </ul>
            </div>
          ) : null}
          <div className="pt-2">
            <button className="btn bg-brand text-white px-4 py-2" onClick={useInEditor}>Use in editor</button>
          </div>
        </div>
      )}
    </div>
  );
}
