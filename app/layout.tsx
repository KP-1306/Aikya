// app/layout.tsx
import "../styles/globals.css";
import type { Metadata } from "next";
import { clsx } from "clsx";
import Link from "next/link";
import NavUser from "@/components/NavUser";
import PageviewPing from "@/components/PageviewPing";

export const metadata: Metadata = {
  title: "Aikya — Good Around You",
  description: "Local-first, uplifting stories with life lessons.",
  metadataBase: new URL("https://aikyanow.netlify.app"),
  openGraph: {
    title: "Aikya — Good Around You",
    description: "Local-first, uplifting stories with life lessons.",
    url: "https://aikyanow.netlify.app",
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
        {/* analytics ping */}
        <PageviewPing />

        {/* header */}
        <header className="border-b bg-white/70 backdrop-blur">
          <div className="container flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="text-brand">☀️ Aikya</span>News
            </Link>
            
<Link href="/coach" className="hover:underline">Coach</Link>

            {/* right side nav */}
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/search" className="hover:underline">
                Search
              </Link>
              <Link href="/submit" className="hover:underline">
                Submit
              </Link>
              <Link href="/about" className="hover:underline">
                About
              </Link>
              {/* account menu (server component) */}
              {/* @ts-expect-error Server Component in layout */}
              <NavUser />
            </nav>
          </div>
        </header>

        {/* main */}
        <main className="container py-6">{children}</main>

        {/* footer */}
        <footer className="border-t py-10 text-sm text-neutral-500">
          <div className="container flex justify-between">
            <p>© {new Date().getFullYear()} Aikya</p>
            <p>
              <Link href="/privacy" className="hover:underline">
                Privacy
              </Link>
              {" · "}
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
