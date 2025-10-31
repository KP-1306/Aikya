// components/Avatar.tsx
import Image from "next/image";
import clsx from "clsx";

type AvatarProps = {
  name?: string | null;
  email?: string | null;
  src?: string | null;
  size?: number;           // px
  className?: string;
};

function getInitials(name?: string | null, email?: string | null) {
  const basis = (name && name.trim()) || (email && email.trim()) || "";
  if (!basis) return "🙂";
  const parts = basis.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function Avatar({ name, email, src, size = 28, className }: AvatarProps) {
  const initials = getInitials(name, email);
  const dim = { width: size, height: size };

  return (
    <div
      className={clsx(
        "inline-flex items-center justify-center rounded-full bg-neutral-200 text-neutral-700 select-none overflow-hidden",
        className
      )}
      style={{ width: size, height: size }}
      aria-label={name || email || "User"}
      title={name || email || "User"}
    >
      {src ? (
        <Image
          src={src}
          alt={name || email || "User"}
          {...dim}
          className="object-cover"
        />
      ) : (
        <span className="text-[0.7rem] font-medium leading-none">
          {initials}
        </span>
      )}
    </div>
  );
}
