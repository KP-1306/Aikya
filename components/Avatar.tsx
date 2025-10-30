"use client";

import { useMemo, useState } from "react";

type Props = {
  name?: string | null;
  email?: string | null;
  src?: string | null;
  size?: number;          // pixels
  className?: string;
};

export default function Avatar({
  name,
  email,
  src,
  size = 28,
  className,
}: Props) {
  const [errored, setErrored] = useState(false);

  // Prefer name → email (local-part) for initials
  const initials = useMemo(() => {
    const basis =
      (name && name.trim()) ||
      (email ? email.split("@")[0] : "") ||
      "";
    const chars = basis
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "");
    const joined = chars.join("");
    return joined || "A";
  }, [name, email]);

  const label = name || email || "User";

  if (!src || errored) {
    return (
      <div
        className={`inline-flex select-none items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-semibold ${className ?? ""}`}
        style={{ width: size, height: size, lineHeight: `${size}px` }}
        aria-label={label}
        title={label}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={label}
      width={size}
      height={size}
      className={`inline-block rounded-full object-cover ${className ?? ""}`}
      onError={() => setErrored(true)}
      referrerPolicy="no-referrer"
      decoding="async"
    />
  );
}
