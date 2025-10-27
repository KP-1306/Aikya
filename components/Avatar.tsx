"use client";

type Props = {
  name?: string | null;
  email?: string | null;
  src?: string | null;
  size?: number; // px
};

function initialsFrom(name?: string | null, email?: string | null) {
  const n = (name || email || "").trim();
  if (!n) return "🙂";
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ name, email, src, size = 28 }: Props) {
  const initials = initialsFrom(name, email);
  const s = { width: size, height: size };

  if (src) {
    // Try image; if it breaks, CSS background will still show initials color
    return (
      <div
        className="inline-flex items-center justify-center rounded-full bg-neutral-200 overflow-hidden"
        style={s}
        aria-label={name || email || "User"}
        title={name || email || "User"}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={name || email || "User"}
          width={size}
          height={size}
          onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
        />
        <span className="text-[11px] font-medium text-neutral-700">{initials}</span>
      </div>
    );
  }

  return (
    <div
      className="inline-flex select-none items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
      style={s}
      aria-label={name || email || "User"}
      title={name || email || "User"}
    >
      <span className="text-[11px] font-medium">{initials}</span>
    </div>
  );
}
