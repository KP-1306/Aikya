import { Suspense } from "react";
import { SubmitInner } from "./parts";

export const metadata = {
  title: "Submit a Story • Aikya",
  description:
    "Share a short, verifiable story/news of good from your city. Follow our what/how/why format.",
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
          <li><strong>Sources:</strong> include links (news, posts, org pages) we can verify.</li>
          <li><strong>People’s privacy:</strong> no doxxing, hate, harassment, or graphic content.</li>
          <li><strong>Location:</strong> add city, state, country so locals can find it.</li>
          <li><strong>Originality:</strong> submit your own words; quote and credit sources.</li>
        </ul>
      </section>

      <Suspense>
        <SubmitInner />
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

// app/submit/parts.tsx
"use client";

import { useSearchParams } from "next/navigation";

export function SubmitInner() {
  const sp = useSearchParams();
  const sent = sp.get("sent") === "1";

  if (sent) {
    return (
      <div className="mt-8 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-emerald-800">
        Thanks! Your story/news was submitted. Editors will review it shortly.
      </div>
    );
  }

  return (
    <form
      name="submit-story"
      method="POST"
      data-netlify="true"
      netlify-honeypot="bot-field"
      action="/submit?sent=1"
      className="mt-8 grid grid-cols-1 gap-4"
    >
      {/* Netlify needs these */}
      <input type="hidden" name="form-name" value="submit-story" />
      <p className="hidden">
        <label>Don’t fill this out: <input name="bot-field" /></label>
      </p>

      <label className="text-sm">
        <span className="mb-1 block font-medium">Title</span>
        <input
          name="title"
          required
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          placeholder="Short, clear headline"
        />
      </label>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block font-medium">City</span>
          <input name="city" className="w-full rounded-md border border-neutral-300 px-3 py-2" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">State</span>
          <input name="state" className="w-full rounded-md border border-neutral-300 px-3 py-2" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Country</span>
          <input name="country" className="w-full rounded-md border border-neutral-300 px-3 py-2" />
        </label>
      </div>

      <label className="text-sm">
        <span className="mb-1 block font-medium">What happened?</span>
        <textarea
          name="what"
          required
          rows={4}
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          placeholder="The core event. Keep it factual."
        />
      </label>

      <label className="text-sm">
        <span className="mb-1 block font-medium">How did it happen?</span>
        <textarea
          name="how"
          required
          rows={4}
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          placeholder="Who did what? Steps, actions, contributors."
        />
      </label>

      <label className="text-sm">
        <span className="mb-1 block font-medium">Why does it matter?</span>
        <textarea
          name="why"
          required
          rows={4}
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          placeholder="Impact, lesson, or useful takeaway."
        />
      </label>

      <label className="text-sm">
        <span className="mb-1 block font-medium">Sources (links)</span>
        <textarea
          name="sources"
          rows={3}
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          placeholder="One per line — news, posts, organization pages."
        />
      </label>

      <label className="text-sm">
        <span className="mb-1 block font-medium">Your email
