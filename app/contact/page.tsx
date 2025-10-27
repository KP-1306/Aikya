// app/contact/page.tsx
import { Suspense } from "react";
import ContactForm from "./ContactForm";

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

      <Suspense fallback={<div className="mt-8">Loading…</div>}>
        <ContactForm />
      </Suspense>

      <div className="mt-12">
        <a href="/" className="underline">← Back to home</a>
      </div>
    </main>
  );
}
