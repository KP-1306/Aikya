// lib/certificates/template.ts
export function certificateSVG(opts: {
  actId: string;
  personName: string;
  title?: string;       // optional headline ("Proof of Good")
  dateISO?: string;     // e.g. 2025-03-01
}) {
  const title = opts.title ?? "Proof of Good — Aikya";
  const date = opts.dateISO
    ? new Date(opts.dateISO).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })
    : new Date().toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });

  return `
<svg width="1600" height="900" viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f0fdf4"/>
      <stop offset="100%" stop-color="#ecfeff"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="1600" height="900" fill="url(#bg)"/>
  <rect x="60" y="60" width="1480" height="780" rx="24" fill="#ffffff" stroke="#e5e7eb" stroke-width="4"/>
  <text x="800" y="190" font-family="ui-sans-serif, system-ui, -apple-system" font-size="56" text-anchor="middle" fill="#111827" font-weight="700">
    ${title}
  </text>
  <text x="800" y="270" font-family="ui-sans-serif, system-ui, -apple-system" font-size="28" text-anchor="middle" fill="#6b7280">
    This certificate recognizes a verified act that made someone's day better.
  </text>

  <text x="800" y="420" font-family="ui-sans-serif, system-ui, -apple-system" font-size="44" text-anchor="middle" fill="#0ea5e9" font-weight="700">
    ${escapeXML(opts.personName)}
  </text>

  <text x="800" y="480" font-family="ui-sans-serif, system-ui, -apple-system" font-size="24" text-anchor="middle" fill="#374151">
    Act ID: ${escapeXML(opts.actId)}
  </text>

  <text x="800" y="540" font-family="ui-sans-serif, system-ui, -apple-system" font-size="24" text-anchor="middle" fill="#374151">
    Issued on ${escapeXML(date)}
  </text>

  <g transform="translate(560,640)">
    <rect width="480" height="80" rx="40" fill="#111827"/>
    <text x="240" y="50" font-family="ui-sans-serif, system-ui, -apple-system" font-size="26" text-anchor="middle" fill="#ffffff">
      Aikya • Good Around You
    </text>
  </g>
</svg>`;
}

function escapeXML(s: string) {
  return s.replace(/[<>&"']/g, m =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" } as any)[m]
  );
}
