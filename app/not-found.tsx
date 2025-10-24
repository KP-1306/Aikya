export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto text-center py-16">
      <h1 className="text-2xl font-semibold mb-2">We couldn’t find that page</h1>
      <p className="text-neutral-600 mb-6">But there’s plenty of good news near you.</p>
      <a href="/" className="rounded-xl bg-brand text-white px-4 py-2">Back to home</a>
    </div>
  );
}
