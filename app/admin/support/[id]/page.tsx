// app/admin/support/[id]/page.tsx
import { supabaseServer } from "@/lib/supabase/server";

export default async function AdminSupportReview({ params }: { params: { id: string } }) {
  const sb = supabaseServer();

  // Admin check via helper
  const { data: isAdmin } = await sb.rpc("is_admin").single().catch(() => ({ data: false }));
  if (!isAdmin) {
    return <main className="container py-10">Forbidden.</main>;
    }

  const { data, error } = await sb.from("support_actions").select("*").eq("id", params.id).single();
  if (error || !data) return <main className="container py-10">Not found.</main>;

  async function SetStatus(formData: FormData) {
    "use server";
    const sb2 = supabaseServer();
    const status = formData.get("status")?.toString();
    if (!status) return;
    // Call admin API (enforces admin again and uses service role for write)
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/admin/support/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
      cache: "no-store",
    });
  }

  const a = data as any;

  return (
    <main className="container max-w-2xl py-10 space-y-6">
      <header className="space-y-1">
        <div className="text-xs text-neutral-500">{new Date(a.updated_at).toLocaleString()}</div>
        <h1 className="text-2xl font-semibold">Admin review</h1>
        <div className="text-sm">{a.title}</div>
        <div className="text-xs rounded-full bg-neutral-100 inline-block px-2 py-0.5">{a.status}</div>
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
          <div className="text-sm text-neutral-500">No evidence URL.</div>
        )}
      </section>

      <form action={SetStatus} className="flex gap-2 border-t pt-6">
        <input type="hidden" name="id" value={a.id} />
        <button name="status" value="in_progress" className="btn-secondary">Mark In-progress</button>
        <button name="status" value="verified" className="btn">Verify</button>
        <button name="status" value="rejected" className="btn-destructive">Reject</button>
        <button name="status" value="done" className="btn-secondary">Mark Done</button>
      </form>
    </main>
  );
}
