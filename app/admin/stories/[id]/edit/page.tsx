import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import AdminStoryForm from "@/components/AdminStoryForm";

export default async function EditStoryPage({ params }: { params: { id: string } }) {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/signin");
  const { data: admin } = await sb.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) redirect("/");

  const { data } = await sb.from("stories").select("*").eq("id", params.id).maybeSingle();

  return (
    <div className="container py-8 space-y-6">
      <h1 className="text-2xl font-bold">Edit Story</h1>
      <AdminStoryForm initial={data || {}} />
    </div>
  );
}
