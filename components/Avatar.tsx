"use client";
import { useState } from "react";

type Props = {
  name?: string | null;
  src?: string | null;
  size?: number;           // px
  className?: string;
};

export default function Avatar({ name, src, size = 28, className }: Props) {
  const [errored, setErrored] = useState(false);
  const initials =
    (name || "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(s => s[0]?.toUpperCase() || "")
      .join("") || "A";

  if (!src || errored) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-semibold ${className || ""}`}
        style={{ width: size, height: size }}
        aria-label={name || "User"}
        title={name || "User"}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name || "User"}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className || ""}`}
      onError={() => setErrored(true)}
    />
  );
}
