// app/admin/stories/[id]/edit/page.tsx
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import AdminStoryForm from "@/components/AdminStoryForm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function assertAdminOrOwner() {
  const sb = supabaseServer();
  const sba = sb as any; // cast the client to avoid Postgrest TS overload issues

  // Must be signed in
  const { data: userRes } = await sb.auth.getUser();
  const user = userRes?.user;
  if (!user) redirect("/signin");

  // Prefer RPC is_admin()
  try {
    const { data, error } = await sb.rpc("is_admin").single();
    if (!error && (data as unknown as boolean) === true) return user.id;
  } catch {
    /* ignore and fall back */
  }

  // Fallback: user_profiles → profiles
  let role: string | null = null;

  const up = await sba
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!up.error) role = (up.data as any)?.role ?? null;

  if (!role) {
    const pf = await sba
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (!pf.error) role = (pf.data as any)?.role ?? null;
  }

  if (role === "admin" || role === "owner") return user.id;

  redirect("/"); // not authorized
}

export default async function EditStoryPage({ params }: { params: { id: string } }) {
  await assertAdminOrOwner();

  const sb = supabaseServer();
  const sba = sb as any; // cast for all .from(...) calls

  // Load story for edit
  const { data } = await sba
    .from("stories")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  return (
    <div className="container py-8 space-y-6">
      <h1 className="text-2xl font-bold">Edit Story</h1>
      <AdminStoryForm initial={data || {}} />
    </div>
  );
}
