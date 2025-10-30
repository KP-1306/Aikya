import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Aikya",
  description:
    "The terms that govern your use of Aikya, including content rules, rights, and responsibilities.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 prose prose-zinc dark:prose-invert">
      <h1>Terms of Service</h1>
      <p>
        Welcome to Aikya. By accessing or using Aikya, you agree to these Terms.
        If you do not agree, do not use the service.
      </p>

      <h2>1. Service overview</h2>
      <p>
        Aikya is a positive-news network featuring curated stories, community
        reactions (likes/saves), comments, and non-cash certificates. We may use
        assistive AI with human review to help summarize public sources and
        support moderation.
      </p>

      <h2>2. Accounts & eligibility</h2>
      <ul>
        <li>You must be legally capable of entering into these Terms.</li>
        <li>
          Provide accurate information and keep your account secure. You’re
          responsible for activity under your account.
        </li>
      </ul>

      <h2>3. Your content</h2>
      <p>
        You retain ownership of content you submit (e.g., comments). You grant
        Aikya a worldwide, non-exclusive, royalty-free license to host, store,
        reproduce, modify (e.g., for formatting), display, and distribute your
        content in connection with providing the service.
      </p>
      <p>
        Do not post anything unlawful, deceptive, hateful, harassing, pornographic,
        invasive of privacy, defamatory, spammy, or otherwise harmful. We may
        remove or moderate content that violates these Terms or our community rules.
      </p>

      <h2>4. Prohibited conduct</h2>
      <ul>
        <li>Attempting to breach security or access non-public areas.</li>
        <li>Automated scraping beyond what robots.txt permits.</li>
        <li>Impersonation or misrepresentation.</li>
        <li>Posting personal data of others without consent.</li>
      </ul>

      <h2>5. Moderation & enforcement</h2>
      <p>
        We use a combination of human review, rules, and assistive AI to maintain
        community safety. We may remove content, restrict features, or suspend
        accounts that violate these Terms or applicable law.
      </p>

      <h2>6. Intellectual property</h2>
      <p>
        Aikya and its logos, product names, and design elements are protected by
        intellectual property rights. Third-party marks are the property of their
        owners and used for identification only.
      </p>

      <h2>7. Certificates</h2>
      <p>
        Certificates are a <em>non-cash</em> way to acknowledge positive actions.
        They have no monetary value and do not represent endorsements by Aikya.
      </p>

      <h2>8. Disclaimers</h2>
      <p>
        Aikya is provided “as is.” We do not guarantee uninterrupted or error-free
        operation, accuracy of third-party sources, or that every story will meet
        your expectations. Use Aikya at your own risk.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, Aikya and its affiliates are not
        liable for indirect, incidental, special, consequential, or punitive
        damages, or any loss of profits or revenues, whether incurred directly or
        indirectly, or any loss of data, use, goodwill, or other intangible losses,
        resulting from (a) your use of or inability to use Aikya; (b) any content
        obtained from Aikya; or (c) unauthorized access, use, or alteration of
        your content.
      </p>

      <h2>10. Termination</h2>
      <p>
        You may stop using Aikya at any time. We may suspend or terminate access
        if you violate these Terms, harm other users, or create legal risk.
      </p>

      <h2>11. Changes</h2>
      <p>
        We may modify these Terms to reflect changes to our service or the law.
        We’ll post updates here with a new “Last updated” date. Continued use
        after changes means you accept the updated Terms.
      </p>

      <h2>12. Governing law</h2>
      <p>
        These Terms are governed by applicable law in your place of residence
        unless a different jurisdiction is required by mandatory law. Local
        consumer rights remain unaffected.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these Terms:{" "}
        <a href="mailto:legal@aikya.example">legal@aikya.example</a>
      </p>

      <p className="text-sm text-zinc-500">Last updated: 30 Oct 2025</p>

      <p className="text-sm">
        See also our <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </main>
  );
}
