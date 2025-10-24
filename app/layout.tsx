import "../styles/globals.css";
import type { Metadata } from "next";
import { clsx } from "clsx";

export const metadata: Metadata = {
  title: "Positive News — Good Around You",
  description: "Local-first, uplifting stories with life lessons.",
  metadataBase: new URL("https://example.com"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={clsx("min-h-screen bg-neutral-50")}>
        <header className="border-b bg-white/70 backdrop-blur">
          <div className="container flex items-center justify-between h-16">
            <a href="/" className="flex items-center gap-2 font-semibold">
              <span className="text-brand">☀️ Positive</span>News
            </a>
            <nav className="flex items-center gap-4 text-sm">
              <a href="/submit" className="hover:underline">Submit</a>
              <a href="/about" className="hover:underline">About</a>
              <a href="/signin" className="rounded-full bg-brand text-white px-4 py-1.5">
                Sign in
              </a>
            </nav>
          </div>
        </header>

        <main className="container py-6">{children}</main>

        <footer className="border-t py-10 text-sm text-neutral-500">
          <div className="container flex justify-between">
            <p>© {new Date().getFullYear()} Positive News</p>
            <p>
              <a href="/privacy" className="hover:underline">Privacy</a>
              {" · "}
              <a href="/terms" className="hover:underline">Terms</a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
