import { supabaseServer } from "@/lib/supabase/server";
import Link from "next/link";

export default async function SupportRequestDetail({ params }: { params: { id: string } }) {
  const sb = supabaseServer();
  const { data: req } = await sb.from("support_requests")
    .select("id,user_id,kind,title,details,state,city,visibility,status,created_at")
    .eq("id", params.id).maybeSingle();

  if (!req) return <div className="container py-8">Request not found.</div>;

  return (
    <div className="container max-w-2xl py-8 space-y-4">
      <div className="text-sm text-neutral-500">{req.kind} · {req.state || req.city || "—"} · {new Date(req.created_at).toLocaleString()}</div>
      <h1 className="text-2xl font-bold">{req.title}</h1>
      {(req.visibility === "public") && <p className="whitespace-pre-wrap">{req.details}</p>}

      <div className="flex gap-3">
        <OfferHelpButton requestId={req.id} />
        <Link href="/support" className="text-sm underline">Back</Link>
      </div>
    </div>
  );
}

function OfferHelpButton({ requestId }: { requestId: string }) {
  // a light client component would fetch the user's active offer and call /api/support/matches/propose
  return (
    <form action={`/api/support/matches/propose`} method="post">
      {/* For now ask supporter to paste their offerId; later make a picker */}
      <input type="hidden" name="requestId" value={requestId} />
      {/* If you prefer JSON body, use fetch on a client component */}
      <button className="btn-primary" formAction={undefined} onClick={(e)=>e.preventDefault()}>
        I want to help (wire your client flow)
      </button>
    </form>
  );
}
