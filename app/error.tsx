"use client";
export default function Error({ error }: { error: Error }) {
  return (
    <div className="container py-16 text-center">
      <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
      <p className="text-neutral-600">{error.message || "Please try again."}</p>
    </div>
  );
}
