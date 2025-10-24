import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import AdminStoryForm from "@/components/AdminStoryForm";

export default async function NewStoryPage() {
  const sb = supabaseServer();

  // Auth
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/signin");

  // Admin check
  const { data: admin } = await sb
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) redirect("/");

  return (
    <div className="container py-8 space-y-6">
      <h1 className="text-2xl font-bold">New Story</h1>
      <AdminStoryForm />
    </div>
  );
}
