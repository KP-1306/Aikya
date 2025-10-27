import { Suspense } from "react";
import { ContactInner } from "./parts";

export const metadata = {
  title: "Contact • Aikya",
  description:
    "Contact the Aikya team for ideas, corrections, partnerships, and general questions.",
};

export default function ContactPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Contact</h1>
      <p className="mt-3 text-neutral-700">
        We love hearing from you. For story tips, corrections, partnerships, or press,
        use the form below or email{" "}
        <a className="underline" href="mailto:hello@aikya.news">hello@aikya.news</a>.
      </p>

      <Suspense>
        <ContactInner />
      </Suspense>

      <div className="mt-12">
        <a href="/" className="underline">← Back to home</a>
      </div>
    </main>
  );
}

// app/contact/parts.tsx
"use client";

import { useSearchParams } from "next/navigation";

export function ContactInner() {
  const sp = useSearchParams();
  const sent = sp.get("sent") === "1";

  if (sent) {
    return (
      <div className="mt-8 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-emerald-800">
        Thanks! Your message has been received. We’ll reply soon.
      </div>
    );
  }

  return (
    <form
      name="contact"
      method="POST"
      data-netlify="true"
      netlify-honeypot="bot-field"
      action="/contact?sent=1"
      className="mt-8 grid grid-cols-1 gap-4"
    >
      {/* Netlify needs these */}
      <input type="hidden" name="form-name" value="contact" />
      <p className="hidden">
        <label>
          Don’t fill this out if you’re human: <input name="bot-field" />
        </label>
      </p>

      <label className="text-sm">
        <span className="mb-1 block font-medium">Your name</span>
        <input
          name="name"
          required
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          placeholder="Your name"
        />
      </label>

      <label className="text-sm">
        <span className="mb-1 block font-medium">Email</span>
        <input
          type="email"
          name="email"
          required
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          placeholder="you@example.com"
        />
      </label>

      <label className="text-sm">
        <span className="mb-1 block font-medium">Subject</span>
        <input
          name="subject"
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          placeholder="What’s it about?"
        />
      </label>

      <label className="text-sm">
        <span className="mb-1 block font-medium">Message</span>
        <textarea
          name="message"
          required
          rows={6}
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          placeholder="Share details — links, context, how we can help."
        />
      </label>

      <div className="mt-2">
        <button
          type="submit"
          className="rounded-md bg-emerald-600 px-4 py-2 text-white"
        >
          Send message
        </button>
      </div>
    </form>
  );
}
