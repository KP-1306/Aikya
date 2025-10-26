// app/account/page.tsx
import { supabaseServer } from "@/lib/supabase/server";

export const revalidate = 0;

export default async function AccountPage() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) {
    return (
      <div className="container max-w-xl py-16">
        <div className="card p-8">
          <h1 className="text-xl font-semibold">Account</h1>
          <p className="mt-2 text-sm text-neutral-600">
            You’re not signed in. <a className="underline" href="/signin">Sign in</a>
          </p>
        </div>
      </div>
    );
  }

  // fetch current profile (lightweight)
  const { data: profile } = await sb
    .from("profiles")
    .select("full_name, city, state, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="container max-w-xl py-10">
      <h1 className="text-xl font-semibold">Account</h1>

      <form
        className="card mt-4 p-6 space-y-4"
        action={async (formData: FormData) => {
          "use server";
          const sb2 = supabaseServer();
          await sb2.from("profiles").upsert({
            id: user.id,
            full_name: String(formData.get("full_name") || ""),
            city: String(formData.get("city") || ""),
            state: String(formData.get("state") || ""),
          }, { onConflict: "id" });
        }}
      >
        <label className="block">
          <div className="text-sm text-neutral-600">Full name</div>
          <input
            name="full_name"
            defaultValue={profile?.full_name ?? ""}
            className="input"
            placeholder="Your name"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <div className="text-sm text-neutral-600">City</div>
            <input
              name="city"
              defaultValue={profile?.city ?? ""}
              className="input"
              placeholder="e.g., Pune"
            />
          </label>
          <label className="block">
            <div className="text-sm text-neutral-600">State</div>
            <input
              name="state"
              defaultValue={profile?.state ?? ""}
              className="input"
              placeholder="e.g., MH"
            />
          </label>
        </div>

        <button className="btn">Save</button>
      </form>
    </div>
  );
}
