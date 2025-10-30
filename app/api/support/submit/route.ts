// app/api/support/submit/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const sb = supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }

    // Accept both classic <form> posts and JSON
    let story_id = "";
    let action_type = "";
    let proof_url = "";
    let proof_text = "";

    const ctype = req.headers.get("content-type") || "";
    if (ctype.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      story_id   = String(body.story_id || "");
      action_type= String(body.action_type || "");
      proof_url  = String(body.proof_url || "");
      proof_text = String(body.proof_text || "");
    } else {
      const fd = await req.formData();
      story_id   = String(fd.get("story_id") || "");
      action_type= String(fd.get("action_type") || "");
      proof_url  = String(fd.get("proof_url") || "");
      proof_text = String(fd.get("proof_text") || "");
    }

    const allowed = new Set(["share","volunteer","organize","mentor","donate_non_cash"]);
    if (!story_id || !allowed.has(action_type) || !proof_text.trim()) {
      return NextResponse.redirect(new URL("/support/submit?error=invalid", req.url));
    }

    const { error } = await sb.from("support_actions").insert({
      user_id: user.id,
      story_id,
      action_type,
      proof_url: proof_url || null,
      proof_text,
      status: "pending",
    });

    if (error) {
      return NextResponse.redirect(new URL("/support/submit?error=db", req.url));
    }

    return NextResponse.redirect(new URL("/support?ok=1", req.url));
  } catch {
    return NextResponse.redirect(new URL("/support/submit?error=unknown", req.url));
  }
}

// Disallow accidental GET usage
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
