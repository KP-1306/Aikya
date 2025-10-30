// app/layout.tsx
import "../styles/globals.css";
import type { Metadata } from "next";
import { clsx } from "clsx";
import Link from "next/link";

import NavUser from "@/components/NavUser";      // server component – safe in layout
import PageviewPing from "@/components/PageviewPing";
import Analytics from "@/components/Analytics";
import Plausible from "@/components/Plausible";  // adds the Plausible snippet when env is set

// Force dynamic rendering globally (prevents build-time prerender errors)
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

// Prefer env for canonical origin; fall back to production URL
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
  "https://aikyanow.netlify.app";

export const metadata: Metadata = {
  title: "Aikya — Good Around You",
  description: "Local-first, uplifting stories with life lessons.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "Aikya — Good Around You",
    description: "Local-first, uplifting stories with life lessons.",
    url: SITE_URL,
    siteName: "Aikya",
    images: [{ url: "/og.jpg", width: 1200, height: 630 }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aikya — Good Around You",
    description: "Local-first, uplifting stories with life lessons.",
    images: ["/og.jpg"],
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={clsx("min-h-screen bg-neutral-50")}>
        <header className="border-b bg-white/70 backdrop-blur">
          <div className="container flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="text-brand">☀️ Aikya</span>News
            </Link>

            {/* right side of the nav */}
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/submit" className="hover:underline">
                Submit
              </Link>
              <Link href="/about" className="hover:underline">
                About
              </Link>
              {/* account menu */}
              <NavUser />
            </nav>
          </div>
        </header>

        {/* lightweight beacon + analytics */}
        <PageviewPing />
        <Analytics />
        <Plausible /> {/* reads NEXT_PUBLIC_PLAUSIBLE_DOMAIN inside the component */}

        <main className="container py-6">{children}</main>

        <footer className="border-t py-10 text-sm text-neutral-500">
          <div className="container flex justify-between">
            <p>© {new Date().getFullYear()} Aikya</p>
            <p>
              <Link href="/privacy" className="hover:underline">
                Privacy
              </Link>{" "}
              ·{" "}
              <Link href="/terms" className="hover:underline">
                Terms
              </Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
