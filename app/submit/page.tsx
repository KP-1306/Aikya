// app/submit/page.tsx
import { Suspense } from "react";
import SubmitForm from "./SubmitForm";

export const metadata = {
  title: "Submit a Story • Aikya",
  description:
    "Share a short, verifiable story of good from your city. Follow our what/how/why format.",
};

export default function SubmitPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Submit a Story</h1>
      <p className="mt-3 text-neutral-700">
        Share a short, factual story of everyday good from your city. We review each
        submission for accuracy, tone, and sources. Keep it brief and positive.
      </p>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Guidelines</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-neutral-700">
          <li><strong>Keep it short:</strong> 150–300 words total.</li>
          <li><strong>Use the format:</strong> What happened? How did it happen? Why does it matter?</li>
          <li><strong>Sources:</strong> include links we can verify.</li>
          <li><strong>Location:</strong> add city, state, country.</li>
          <li><strong>Privacy:</strong> no doxxing, harassment, or graphic content.</li>
        </ul>
      </section>

      <Suspense fallback={<div className="mt-8">Loading…</div>}>
        <SubmitForm />
      </Suspense>

      <p className="mt-6 text-sm text-neutral-600">
        Prefer email? Send tips to{" "}
        <a className="underline" href="mailto:tips@aikya.news">tips@aikya.news</a>.
      </p>

      <div className="mt-12">
        <a href="/" className="underline">← Back to home</a>
      </div>
    </main>
  );
}
