export const metadata = {
  title: "About • Aikya",
  description:
    "What Aikya is, how it works, our editorial standards, and how the community can participate.",
};

export default function AboutPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">About</h1>
      <p className="mt-3 text-neutral-700">
        <strong>Aikya</strong> is a community-powered positive news network. We surface
        short, verifiable stories of everyday good—acts of kindness, local
        initiatives, and solutions that work—so people can discover, share, and
        build on them.
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">What we publish</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-neutral-700">
          <li>Short “what / how / why” stories with a clear life-lesson.</li>
          <li>City & state feeds so you can see the good near you.</li>
          <li>Solution spotlights with sources you can verify.</li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">How stories are made</h2>
        <p className="mt-3 text-neutral-700">
          Stories can be submitted by the community or sourced by editors. We use
          Readability extraction and an assistive AI summarizer to draft to the
          Aikya schema, then human editors check facts, tone, and sources before
          publishing.
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-neutral-700">
          <li><strong>Sourcing:</strong> every story includes links to original sources.</li>
          <li><strong>Edits & Corrections:</strong> we fix errors fast and mark updates.</li>
          <li><strong>Attribution:</strong> we credit creators and ask permission when needed.</li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Community standards</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-neutral-700">
          <li>Be kind. Assume good intent; disagree with ideas, not people.</li>
          <li>No harassment, hate speech, misinformation, or spam.</li>
          <li>Report issues via the flag button; moderators will review quickly.</li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Monetization & conflicts</h2>
        <p className="mt-3 text-neutral-700">
          Aikya currently does not run paid ads. Sponsored content, if any,
          will be labeled clearly. Editors must disclose conflicts of interest;
          stories with material conflicts are reassigned.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Contact</h2>
        <p className="mt-3 text-neutral-700">
          Ideas, corrections, partnership inquiries:{" "}
          <a className="underline" href="mailto:hello@aikya.news">hello@aikya.news</a>
        </p>
        <p className="mt-1 text-sm text-neutral-500">Last updated: 27 Oct 2025</p>
      </section>

      <div className="mt-12">
        <a href="/" className="underline">← Back to home</a>
      </div>
    </main>
  );
}
