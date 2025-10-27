// components/Header.tsx (SERVER)
import HeaderClient from "@/components/HeaderClient";
import { supabaseServer } from "@/lib/supabase/server";

export default async function Header() {
  const supabase = supabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  return (
    <HeaderClient
      name={user?.user_metadata?.full_name ?? null}
      email={user?.email ?? null}
      avatar_url={(user?.user_metadata as any)?.avatar_url ?? null}
    />
  );
}
