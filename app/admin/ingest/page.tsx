import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import AdminIngestClient from "@/components/AdminIngestClient";

export default async function AdminIngestPage() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/signin");

  const { data: admin } = await sb.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) redirect("/");

  return (
    <div className="container py-8 space-y-6">
      <h1 className="text-2xl font-bold">Ingest URL → Draft</h1>
      <p className="text-sm text-neutral-600">
        Paste a positive news URL. We’ll fetch, extract, and summarize into our story format.
      </p>
      <AdminIngestClient />
    </div>
  );
}
