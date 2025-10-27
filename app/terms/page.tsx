export const metadata = {
  title: "Terms of Service • Aikya",
  description:
    "Your agreement with Aikya for using the site, posting content, and community participation.",
};

export default function TermsPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-3 text-neutral-700">Last updated: 27 Oct 2025</p>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">1. Acceptance of terms</h2>
        <p className="mt-3 text-neutral-700">
          By accessing or using Aikya, you agree to these Terms and our Privacy
          Policy. If you do not agree, please do not use the service.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">2. Use of the service</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-neutral-700">
          <li>You must provide accurate information and keep your account secure.</li>
          <li>You are responsible for your activity and content you submit.</li>
          <li>Do not misuse the service (no spam, scraping, illegal or harmful behavior).</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">3. Your content & license</h2>
        <p className="mt-3 text-neutral-700">
          You retain ownership of content you submit. You grant Aikya a worldwide,
          non-exclusive, royalty-free license to host, store, reproduce, modify
          (for formatting), and display your content for operating and improving
          the service. You represent you have the rights to submit it.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">4. Moderation</h2>
        <p className="mt-3 text-neutral-700">
          Aikya may remove or restrict content that violates community standards,
          law, or these Terms. Repeated or severe violations may lead to account
          limits or termination. You may report content for review.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">5. Intellectual property</h2>
        <p className="mt-3 text-neutral-700">
          Aikya, our logos, and site design are protected by IP laws. Do not use
          our marks without written permission. For takedown requests, contact{" "}
          <a className="underline" href="mailto:legal@aikya.news">legal@aikya.news</a>.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">6. Disclaimers</h2>
        <p className="mt-3 text-neutral-700">
          Aikya is provided “as is” without warranties of any kind. We do not
          guarantee uninterrupted service or error-free content. Stories may link
          to third-party sites not controlled by us.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">7. Limitation of liability</h2>
        <p className="mt-3 text-neutral-700">
          To the fullest extent permitted by law, Aikya and its operators will
          not be liable for indirect, incidental, special, consequential, or
          punitive damages, or any loss of data, profits, or reputation.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">8. Indemnity</h2>
        <p className="mt-3 text-neutral-700">
          You agree to indemnify and hold Aikya harmless from claims arising out
          of your content or misuse of the service.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">9. Changes to the service or terms</h2>
        <p className="mt-3 text-neutral-700">
          We may update the service or these Terms. Material changes will be
          posted here. Continued use after changes means you accept the new Terms.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">10. Governing law</h2>
        <p className="mt-3 text-neutral-700">
          These Terms are governed by the laws of India. Jurisdiction: courts of
          Uttarakhand, India.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">11. Contact</h2>
        <p className="mt-3 text-neutral-700">
          Questions about these Terms:{" "}
          <a className="underline" href="mailto:legal@aikya.news">legal@aikya.news</a>
        </p>
      </section>

      <div className="mt-12">
        <a href="/" className="underline">← Back to home</a>
      </div>
    </main>
  );
}
