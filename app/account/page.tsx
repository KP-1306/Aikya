// app/account/page.tsx
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import UpdateProfileForm from "@/components/UpdateProfileForm";

export default async function AccountPage() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/signin");

  const { data: profile } = await sb
    .from("profiles")
    .select("full_name, state, city, avatar_url, created_at")
    .eq("id", user.id)
    .maybeSingle();

  return (

    <p className="text-sm">
  See your <a href="/account/saved" className="underline">Saved stories</a>.
</p>
    
    <div className="container max-w-2xl py-10">
      <h1 className="text-2xl font-bold mb-2">Your account</h1>
      <p className="text-neutral-600 mb-6">Manage the details used to personalize local news.</p>

      {/* Read-only basics */}
      <div className="card p-6 space-y-3 mb-6">
        <div className="text-sm">
          <span className="font-medium">Email:</span> {user.email}
        </div>
        <div className="text-sm">
          <span className="font-medium">Member since:</span>{" "}
          {new Date(profile?.created_at ?? user.created_at!).toDateString()}
        </div>
      </div>

      {/* Editable fields */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-3">Profile</h2>
        <UpdateProfileForm
          initialFullName={profile?.full_name ?? ""}
          initialStateValue={profile?.state ?? ""}
          initialCity={profile?.city ?? ""}
          initialAvatarUrl={profile?.avatar_url ?? null}
        />
      </div>
    </div>
  );
}
