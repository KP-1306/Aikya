// app/account/page.tsx
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export default async function AccountPage() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/signin");

  const { data: profile } = await sb.from("profiles")
    .select("full_name, state, created_at")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="container max-w-2xl py-10">
      <h1 className="text-2xl font-bold mb-2">Your account</h1>
      <p className="text-neutral-600 mb-6">Manage your details used for local news.</p>

      <div className="card p-6 space-y-3">
        <div className="text-sm"><span className="font-medium">Email:</span> {user.email}</div>
        <div className="text-sm"><span className="font-medium">Full name:</span> {profile?.full_name ?? "—"}</div>
        <div className="text-sm"><span className="font-medium">State:</span> {profile?.state ?? "—"}</div>
        <div className="text-sm"><span className="font-medium">Member since:</span> {new Date(profile?.created_at ?? user.created_at!).toDateString()}</div>
      </div>
    </div>
  );
}
