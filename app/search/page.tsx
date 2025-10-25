// app/search/page.tsx
import QuoteSearch from "@/components/QuoteSearch";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = {
  title: "Search by Quote — Aikya",
  description: "Paste a motivational quote and discover real stories that live the same values.",
};

export default async function SearchPage() {
  // Optional: prefill with user's state for local bias (if you store it)
  const { data: { user } } = await supabaseServer().auth.getUser();
  // If you keep state in profiles, uncomment:
  // const { data: prof } = await supabaseServer()
  //   .from("profiles").select("state").eq("id", user?.id).maybeSingle();
  const defaultState: string | undefined = undefined; // replace with prof?.state

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-2">Search by Quote</h1>
      <p className="text-neutral-600 mb-6">
        Paste a line from the Gītā or any motivational quote, and we’ll find real, positive stories that express the same values.
      </p>
      <QuoteSearch defaultState={defaultState} />
    </div>
  );
}
