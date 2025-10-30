import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Aikya",
  description:
    "How Aikya collects, uses, and protects your data. Clear choices, minimal data, and human-first safeguards.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 prose prose-zinc dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p>
        We built Aikya to spotlight good news with minimal data collection and
        transparent controls. This policy explains what we collect, why, and how
        you can exercise your choices.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account basics</strong>: Email address and profile info you
          choose to provide (e.g., city/state/country).
        </li>
        <li>
          <strong>App activity</strong>: Saves, likes, comments, and basic usage
          telemetry to improve recommendations and reliability.
        </li>
        <li>
          <strong>Technical data</strong>: Standard logs (IP, device/browser,
          pages visited) for security and performance.
        </li>
        <li>
          <strong>Content submissions</strong>: Comments, story tips, and any
          files/links you voluntarily submit.
        </li>
      </ul>

      <h2>How we use data</h2>
      <ul>
        <li>Provide the service (authentication, feeds, reactions, comments).</li>
        <li>Improve relevance (location-aware feed; “popular last 30d”).</li>
        <li>Keep the community safe (moderation, abuse prevention, rate limits).</li>
        <li>Communicate with you (transactional emails; optional digests if you opt in).</li>
      </ul>

      <h2>AI assistance</h2>
      <p>
        Aikya uses assistive AI to help summarize public articles and support
        moderation. AI output is reviewed or constrained with rules and fallbacks.
        We do not sell your personal data to AI providers.
      </p>

      <h2>Legal bases</h2>
      <p>
        Depending on your region, we process data to perform our contract with
        you (provide Aikya), for legitimate interests (security, quality, and
        relevance), and with consent where required (e.g., marketing digests).
      </p>

      <h2>Sharing</h2>
      <p>
        We use trusted service providers to run Aikya (e.g., hosting/CDN,
        authentication, email). They process data on our behalf under contracts
        that protect your information. We may share content you publish (e.g.,
        comments) according to the product’s normal function.
      </p>
      <ul>
        <li>Hosting & CDN (e.g., Netlify or equivalent)</li>
        <li>Authentication & Database (e.g., Supabase)</li>
        <li>Email (transactional provider, if enabled)</li>
        <li>Analytics (privacy-respecting usage trends)</li>
      </ul>

      <h2>Retention</h2>
      <p>
        We keep data only as long as necessary for the purposes described here
        (or as required by law). You may request deletion of your account data.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>Update profile and location in your account settings.</li>
        <li>Unsubscribe from optional emails at any time.</li>
        <li>
          Request data export or deletion by emailing{" "}
          <a href="mailto:privacy@aikya.example">privacy@aikya.example</a>.
        </li>
      </ul>

      <h2>Children</h2>
      <p>
        Aikya is not intended for children under the age of 13 (or the minimum
        age in your jurisdiction). Do not use Aikya if you do not meet the age
        requirement.
      </p>

      <h2>Security</h2>
      <p>
        We use industry-standard safeguards (encryption in transit, access
        controls, audit logs) and limit access to personal data to authorized
        personnel and contractors who need it to operate Aikya.
      </p>

      <h2>International transfers</h2>
      <p>
        Your data may be processed in countries different from where you reside.
        We rely on appropriate safeguards where required.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this policy as Aikya evolves. We’ll post the new version
        here and update the “Last updated” date.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy questions or requests:{" "}
        <a href="mailto:privacy@aikya.example">privacy@aikya.example</a>
      </p>

      <p className="text-sm text-zinc-500">Last updated: 30 Oct 2025</p>

      <p className="text-sm">
        See also our <Link href="/terms">Terms of Service</Link>.
      </p>
    </main>
  );
}
