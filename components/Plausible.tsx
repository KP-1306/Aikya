// components/Plausible.tsx
"use client";

import Script from "next/script";

export default function Plausible() {
  const domain =
    process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ||
    new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://aikyanow.netlify.app").hostname;

  const enabled = process.env.NEXT_PUBLIC_PLAUSIBLE_ENABLED === "1";
  if (!enabled) return null;

  return (
    <Script
      defer
      data-domain={domain}
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  );
}
