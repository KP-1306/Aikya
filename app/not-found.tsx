// app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container py-16 space-y-4">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-neutral-600">
        The page you’re looking for doesn’t exist or has moved.
      </p>
      <div className="flex gap-3">
        <Link href="/" className="btn">Go home</Link>
        <Link href="/about" className="btn-secondary">About Aikya</Link>
      </div>
    </main>
  );
}
