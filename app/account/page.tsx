// app/account/page.tsx
import { supabaseServer } from "@/lib/supabase/server";
import ProfileForm from "@/components/ProfileForm";
import { redirect } from "next/navigation";

export default async function AccountPage() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  // Get the user's profile row (optional fields can be null)
  const { data: profile } = await sb
    .from("profiles")
    .select("full_name, state, city, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="container max-w-2xl py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Your account</h1>
        <p className="text-sm text-neutral-600">
          Update your name and location to personalize your feed.
        </p>
      </header>

      <div className="card p-6">
        <ProfileForm
          initialFullName={profile?.full_name ?? ""}
          initialState={profile?.state ?? ""}
          initialCity={profile?.city ?? ""}
          initialAvatarUrl={profile?.avatar_url ?? ""}
        />
      </div>
    </div>
  );
}
