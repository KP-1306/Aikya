// app/api/support/verify/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSupabaseService } from "@/lib/supabase/service";
import { bumpKarmaBestEffort } from "@/lib/karma/server";

export const runtime = "nodejs";

async function isAdmin(sb: ReturnType<typeof supabaseServer>) {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return false;
  const { data: profile } = await sb.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin";
}

export async function POST(req: Request, ctx: { params: { id: string } }) {
  const id = ctx.params.id;
  const sb = supabaseServer();
  if (!(await isAdmin(sb))) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Accept both form and JSON
  let action = "";
  const ctype = req.headers.get("content-type") || "";
  if (ctype.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    action = String(body.action || "");
  } else {
    const fd = await req.formData().catch(() => null);
    action = String(fd?.get("action") || "");
  }

  if (!["approve","reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { data: row, error: readErr } = await sb
    .from("support_actions")
    .select("id, user_id, status")
    .eq("id", id)
    .single();

  if (readErr || !row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (row.status !== "pending") {
    return NextResponse.json({ error: "Already decided" }, { status: 409 });
  }

  const service = requireSupabaseService();
  const { error: updErr } = await service
    .from("support_actions")
    .update({
      status: action === "approve" ? "approved" : "rejected",
      decided_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  if (action === "approve" && row.user_id) {
    // non-blocking karma bump
    bumpKarmaBestEffort(service, row.user_id, 5, "support_approved").catch(() => {});
  }

  // For forms: redirect back to hub; for programmatic calls you can read the 302.
  return NextResponse.redirect(new URL(`/support?verified=${action}`, req.url));
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
