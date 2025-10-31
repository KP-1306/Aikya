// app/support/verify/[id]/page.tsx
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Verify Support Action – Aikya" };

async function isAdmin(sb: ReturnType<typeof supabaseServer>) {
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return false;

  const { data: profile } = await sb
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin";
}

export default async function VerifySupport({
  params,
}: {
  params: { id: string };
}) {
  const sb = supabaseServer();
  const admin = await isAdmin(sb);

  if (!admin) {
    return (
      <div className="container space-y-4">
        <h1 className="text-xl font-semibold">Not authorized</h1>
        <p className="text-sm text-neutral-600">Admin access required.</p>
        <Link href="/" className="underline">
          Go home
        </Link>
      </div>
    );
  }

  // Note: Supabase may return related rows as an array depending on FK metadata.
  const { data: s, error } = await sb
    .from("support_actions")
    .select(
      `
      id,
      user_id,
      action_type,
      status,
      proof_url,
      proof_text,
      created_at,
      story:stories ( slug, title )
    `
    )
    .eq("id", params.id)
    .maybeSingle();

  if (error || !s) {
    return (
      <div className="container">
        <p className="text-sm text-neutral-600">Submission not found.</p>
      </div>
    );
  }

  // Normalize story relation (object vs array)
  const story = Array.isArray((s as any).story)
    ? (s as any).story[0] ?? null
    : (s as any).story ?? null;

  const disabled = s.status !== "pending";

  return (
    <div className="container space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Verify submission</h1>
        <p className="text-sm text-neutral-600">ID: {s.id}</p>
      </header>

      <div className="card p-4 space-y-2 max-w-2xl">
        <div className="text-sm">
          <span className="font-medium">Story:</span>{" "}
          {story?.slug ? (
            <Link className="underline" href={`/story/${story.slug}`}>
              {story.title ?? story.slug}
            </Link>
          ) : (
            <span className="text-neutral-500">—</span>
          )}
        </div>

        <div className="text-sm">
          <span className="font-medium">Action:</span> {s.action_type}
        </div>
        <div className="text-sm">
          <span className="font-medium">Status:</span> {s.status}
        </div>

        {s.proof_url && (
          <div className="text-sm break-all">
            <span className="font-medium">Proof URL:</span> {s.proof_url}
          </div>
        )}

        <div className="text-sm">
          <span className="font-medium">Note:</span> {s.proof_text || "—"}
        </div>

        <div className="text-xs text-neutral-500">
          Submitted: {new Date(s.created_at).toLocaleString()}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <form action={`/api/support/verify/${s.id}`} method="POST">
          <input type="hidden" name="action" value="approve" />
          <button className="btn" disabled={disabled} type="submit">
            Approve
          </button>
        </form>

        <form action={`/api/support/verify/${s.id}`} method="POST">
          <input type="hidden" name="action" value="reject" />
          <button className="btn-secondary" disabled={disabled} type="submit">
            Reject
          </button>
        </form>

        <Link href="/support" className="underline text-sm">
          Back
        </Link>
      </div>
    </div>
  );
}
