import Link from "next/link";

export const metadata = {
  title: "About Aikya",
  description:
    "Aikya is a positive-news network that surfaces acts of good near you. Built with thoughtful AI assistance, human moderation, and community karma.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 prose prose-zinc dark:prose-invert">
      <h1>About Aikya</h1>
      <p>
        Aikya is a positive-news network that highlights real{" "}
        <strong>acts of good</strong>, verified stories, and hopeful ideas from
        your city, your state, and beyond. Our goal is simple: make it easier
        to discover what’s working in the world—so more of it can happen.
      </p>

      <h2>What we publish</h2>
      <ul>
        <li>Short, clear stories with the <em>what / how / why</em>.</li>
        <li>Concrete <strong>life lessons</strong> and useful links.</li>
        <li>Location-aware feeds (City → State → All) so you see good around you.</li>
        <li>Community signals: saves, likes, comments, and certificates of appreciation.</li>
      </ul>

      <h2>How Aikya works</h2>
      <ol>
        <li>
          <strong>Source</strong>: Editors collect public, credible sources and
          incoming tips.
        </li>
        <li>
          <strong>Summarize</strong>: We use a careful Readability extract and a
          lightweight AI pass to create a structured summary (title, dek, what /
          how / why, lesson, sources). If AI is unavailable, a safe fallback
          keeps things human-only.
        </li>
        <li>
          <strong>Review</strong>: Human moderation checks tone, safety, and
          accuracy signals before publishing.
        </li>
        <li>
          <strong>Celebrate</strong>: Readers can like, save, comment, and—where
          appropriate—issue <em>non-cash</em> certificates to recognize good
          work.
        </li>
      </ol>

      <h2>Our editorial principles</h2>
      <ul>
        <li>
          <strong>Truth first</strong>: We cite sources and avoid sensationalism.
        </li>
        <li>
          <strong>Useful optimism</strong>: We prioritize stories that teach a
          repeatable lesson.
        </li>
        <li>
          <strong>Community safety</strong>: Clear rules for comments and
          moderation; transparent enforcement.
        </li>
        <li>
          <strong>Privacy</strong>: Minimal data, clear choices. See our{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </li>
      </ul>

      <h2>Technology & safeguards</h2>
      <p>
        Aikya runs on a modern web stack with fine-grained access control. AI
        support is <em>assistive, not autonomous</em>—humans remain in the loop
        for editorial judgment. We log community signals (likes, saves, comments)
        to improve recommendations, and we offer a simple “Karma Coach” to nudge
        positive participation. See also our{" "}
        <Link href="/terms">Terms of Service</Link>.
      </p>

      <h2>For partners & investors</h2>
      <ul>
        <li>
          <strong>Structured content model</strong> enables trusted distribution
          (newsletters, embeds, partner feeds).
        </li>
        <li>
          <strong>Quality at scale</strong> via hybrid human + AI workflows and
          rule-based moderation.
        </li>
        <li>
          <strong>Measurable impact</strong>: Engagement, saves, location spread,
          and certificate issuance.
        </li>
      </ul>

      <h2>Contact</h2>
      <p>
        Questions, partnerships, or press:{" "}
        <a href="mailto:hello@aikya.example">hello@aikya.example</a>
      </p>

      <p className="text-sm text-zinc-500">Last updated: 30 Oct 2025</p>
    </main>
  );
}
