export const metadata = {
  title: "Privacy Policy • Aikya",
  description:
    "How Aikya collects, uses, stores, and protects your data, plus your choices and rights.",
};

export default function PrivacyPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-3 text-neutral-700">Last updated: 27 Oct 2025</p>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Who we are</h2>
        <p className="mt-3 text-neutral-700">
          Aikya is a community news platform. This policy explains what we
          collect and why, how we use it, and the choices you have.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Data we collect</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-neutral-700">
          <li><strong>Account data:</strong> email, profile name, city/state/country.</li>
          <li><strong>Usage data:</strong> page views, likes/saves, comments, device info.</li>
          <li><strong>Content:</strong> stories and comments you submit.</li>
          <li><strong>Cookies:</strong> session cookies and an anonymous ID for analytics.</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">How we use data</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-neutral-700">
          <li>Provide and secure the service (authentication, moderation, abuse prevention).</li>
          <li>Personalize feeds by city/state and show popular stories.</li>
          <li>Send account emails (magic links, notices you request).</li>
          <li>Measure and improve product performance.</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Sharing & processors</h2>
        <p className="mt-3 text-neutral-700">
          We do not sell your personal data. We use trusted processors to run
          Aikya, for example hosting (Netlify), database & auth (Supabase),
          email delivery, and analytics. They process data on our behalf under
          contracts and security commitments.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Retention</h2>
        <p className="mt-3 text-neutral-700">
          Account data is retained while your account is active. You may request
          deletion; we will delete or anonymize data unless we must retain it for
          legal or security reasons (e.g., abuse investigations, audit logs).
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Security</h2>
        <p className="mt-3 text-neutral-700">
          We use industry practices such as encryption in transit, role-based
          access, and row-level security. No internet service can be 100% secure,
          but we work to protect your information and promptly remediate issues.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Your choices</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-neutral-700">
          <li>Access/Update: edit your profile and preferences in the Account page.</li>
          <li>Export/Delete: email us to request a copy or deletion of your data.</li>
          <li>Cookies: block or delete cookies in your browser (site features may break).</li>
          <li>Emails: we only email you for account actions you initiate.</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Children</h2>
        <p className="mt-3 text-neutral-700">
          Aikya is not directed to children under 13. If you believe a child has
          provided us personal data, contact us for removal.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Regional rights</h2>
        <p className="mt-3 text-neutral-700">
          Depending on your location, you may have additional privacy rights
          (e.g., GDPR/CCPA). We honor valid requests subject to verification.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Contact</h2>
        <p className="mt-3 text-neutral-700">
          Privacy questions or requests:{" "}
          <a className="underline" href="mailto:privacy@aikya.news">privacy@aikya.news</a>
        </p>
      </section>

      <div className="mt-12">
        <a href="/" className="underline">← Back to home</a>
      </div>
    </main>
  );
}
