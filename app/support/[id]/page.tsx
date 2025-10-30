// app/support/[id]/page.tsx
import { supabaseServer } from "@/lib/supabase/server";

export default async function SupportDetail({ params }: { params: { id: string } }) {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return <main className="container py-10">Sign in to view this action.</main>;
  }

  const { data, error } = await sb
    .from("support_actions")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return <main className="container py-10">Not found.</main>;
  }

  const a = data as any;

  async function OwnerPatch(formData: FormData) {
    "use server";
    const sb2 = supabaseServer();
    const payload: Record<string, any> = {
      title: formData.get("title")?.toString() ?? undefined,
      description: formData.get("description")?.toString() ?? undefined,
      city: formData.get("city")?.toString() ?? undefined,
      state: formData.get("state")?.toString() ?? undefined,
      evidence_url: formData.get("evidence_url")?.toString() ?? undefined,
    };
    await sb2.from("support_actions").update(payload).eq("id", params.id);
  }

  return (
    <main className="container max-w-2xl py-10 space-y-6">
      <header className="space-y-1">
        <div className="text-xs text-neutral-500">{new Date(a.updated_at).toLocaleString()}</div>
        <h1 className="text-2xl font-semibold">{a.title}</h1>
        <span className="text-xs rounded-full bg-neutral-100 px-2 py-0.5">{a.status}</span>
      </header>

      <section className="space-y-2">
        {a.description ? <p className="text-neutral-700 whitespace-pre-wrap">{a.description}</p> : <p className="text-neutral-500">No description.</p>}
        <div className="text-sm text-neutral-600">
          {(a.city || a.state) ? [a.city, a.state].filter(Boolean).join(", ") : "—"}
        </div>
        {a.evidence_url ? (
          <a href={a.evidence_url} target="_blank" className="text-sm underline break-all">
            Evidence
          </a>
        ) : (
          <div className="text-sm text-neutral-500">No evidence URL yet.</div>
        )}
      </section>

      {/* Owner edit (server action, respects RLS) */}
      <form action={OwnerPatch} className="space-y-3 border-t pt-6">
        <h2 className="font-medium">Update details</h2>

        <input type="hidden" name="id" value={a.id} />
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input name="title" defaultValue={a.title ?? ""} className="mt-1 w-full rounded border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea name="description" defaultValue={a.description ?? ""} rows={4} className="mt-1 w-full rounded border px-3 py-2" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">City</label>
            <input name="city" defaultValue={a.city ?? ""} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">State</label>
            <input name="state" defaultValue={a.state ?? ""} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Evidence URL</label>
          <input name="evidence_url" defaultValue={a.evidence_url ?? ""} className="mt-1 w-full rounded border px-3 py-2" />
        </div>

        <div className="flex gap-3">
          <button className="btn">Save</button>
        </div>
      </form>
    </main>
  );
}
