"use client";

import { useState, useTransition } from "react";

export default function AdminHideToggle({
  kind,           // "request" | "offer"
  id,
  hidden,
}: {
  kind: "request" | "offer";
  id: string;
  hidden: boolean;
}) {
  const [isHidden, setIsHidden] = useState(hidden);
  const [pending, start] = useTransition();

  async function toggle() {
    const url =
      kind === "request"
        ? "/api/admin/support/requests/toggle"
        : "/api/admin/support/offers/toggle";

    start(async () => {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Failed");
        setIsHidden(j.hidden === true);
      } catch (e) {
        // no-op; you can toast an error here if you use a toaster
        console.error(e);
      }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`rounded px-3 py-1.5 text-sm ${isHidden ? "bg-neutral-800 text-white" : "bg-neutral-200"}`}
      title={isHidden ? "Unhide" : "Hide"}
    >
      {pending ? "…" : isHidden ? "Unhide" : "Hide"}
    </button>
  );
}
