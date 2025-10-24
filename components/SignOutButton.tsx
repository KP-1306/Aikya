// components/SignOutButton.tsx
"use client";
import { supabase } from "@/lib/supabase/client";

export default function SignOutButton() {
  return (
    <button
      onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
      className="btn border"
      aria-label="Sign out"
    >
      Sign out
    </button>
  );
}
