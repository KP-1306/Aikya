// components/Avatar.tsx
import Image from "next/image";
import clsx from "clsx";

type Props = {
  name?: string;
  email?: string;
  src?: string;
  size?: number; // px
  className?: string;
};

function initials(name?: string, email?: string) {
  const basis = (name || email || "").trim();
  if (!basis) return "🙂";
  const parts = basis.split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase() || "").join("") || "🙂";
}

export default function Avatar({ name, email, src, size = 28, className }: Props) {
  const dim = { width: size, height: size };
  const label = name || email || "Account";

  return (
    <div
      className={clsx(
        "inline-flex items-center justify-center rounded-full bg-neutral-200 text-neutral-700 overflow-hidden",
        className
      )}
      style={{ width: size, height: size }}
      aria-label={label}
      title={label}
    >
      {src ? (
        <Image
          src={src}
          alt={label}
          {...dim}
          sizes={`${size}px`}
          className="object-cover"
          onError={(e) => {
            // fallback to initials on broken URL
            (e.currentTarget as any).style.display = "none";
          }}
        />
      ) : (
        <span className="text-xs font-medium select-none">{initials(name, email)}</span>
      )}
    </div>
  );
}
