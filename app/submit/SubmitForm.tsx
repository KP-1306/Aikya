// app/submit/SubmitForm.tsx
"use client";

import { useSearchParams } from "next/navigation";

export default function SubmitForm() {
  const sp = useSearchParams();
  const sent = sp.get("sent") === "1";

  if (sent) {
    return (
      <div className="mt-8 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-emerald-800">
        Thanks! Your story was submitted. Editors will review it shortly.
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
      {/* Netlify registration */}
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
        <span className="mb-1 block font-medium">Your email (optional)</span>
        <input
          type="email"
          name="email"
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          placeholder="If we need to follow up"
        />
      </label>

      <div className="mt-2">
        <button type="submit" className="rounded-md bg-emerald-600 px-4 py-2 text-white">
          Submit story
        </button>
      </div>
    </form>
  );
}
