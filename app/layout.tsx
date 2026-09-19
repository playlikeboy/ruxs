import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { HexclaveProvider, HexclaveTheme } from "@hexclave/next";
import { hexclaveServerApp } from "@/src/hexclave/server";
import { PwaManager } from "./components/PwaManager";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const viewport: Viewport = {
  themeColor: "#0b0d0c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://ruxs.in"),
  applicationName: "RUXS",
  title: {
    default: "RUXS — Recurring household life, quietly handled",
    template: "%s · RUXS",
  },
  description: "A simple operating layer for recurring local household services in India.",
  keywords: ["RUXS", "recurring household services", "tiffin", "water delivery", "milk delivery", "digital khata", "local vendor software"],
  authors: [{ name: "RUXS" }],
  creator: "RUXS",
  publisher: "RUXS",
  category: "productivity",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "RUXS",
    title: "RUXS — Recurring household life, quietly handled",
    description: "A simple operating layer for recurring local household services in India.",
    url: "https://ruxs.in/",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "RUXS — recurring household services, quietly handled" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "RUXS — Recurring household life, quietly handled",
    description: "Recurring local services, coordinated with less follow-up and more clarity.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("dark", geist.variable)}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <PwaManager />

        <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
          <div className="ds-container flex h-16 items-center justify-between">
            <Link href="/" className="group flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-brand text-sm font-black text-white transition-transform duration-150 group-hover:-rotate-3">R</span>
              <span className="text-sm font-semibold tracking-[0.08em] text-foreground">RUXS</span>
            </Link>

            <nav aria-label="Primary" className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
              <Link className="transition hover:text-foreground" href="/#services">Services</Link>
              <Link className="transition hover:text-foreground" href="/#how-it-works">How it works</Link>
              <Link className="transition hover:text-foreground" href="/#ledger">Account</Link>
              <Link className="transition hover:text-foreground" href="/vendor/onboard">For vendors</Link>
            </nav>

            <div className="flex items-center gap-2">
              <Link href="/login" className="hidden rounded-xl px-3.5 py-2 text-sm font-medium text-muted-foreground transition hover:bg-white/[0.04] hover:text-foreground sm:inline-flex">Sign in</Link>
              <Link href="/subscribe" className="ds-button min-h-10 px-4 text-xs">Get started</Link>
            </div>
          </div>
        </header>

        <HexclaveProvider app={hexclaveServerApp}>
          <HexclaveTheme>
            <main>{children}</main>
          </HexclaveTheme>
        </HexclaveProvider>

        <footer className="border-t border-border bg-background">
          <div className="ds-container py-12">
            <div className="grid gap-10 sm:grid-cols-[1.2fr_.8fr_.8fr]">
              <div className="max-w-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-brand text-xs font-black text-white">R</span>
                  <span className="text-sm font-semibold tracking-[0.08em]">RUXS</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">The quiet operating layer for recurring local household services.</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-subtle">Explore</p>
                <div className="mt-4 grid gap-2.5 text-sm">
                  <Link href="/#services" className="text-muted-foreground transition hover:text-foreground">Services</Link>
                  <Link href="/#how-it-works" className="text-muted-foreground transition hover:text-foreground">How it works</Link>
                  <Link href="/subscribe" className="text-muted-foreground transition hover:text-foreground">Get started</Link>
                  <Link href="/vendor/onboard" className="text-muted-foreground transition hover:text-foreground">For vendors</Link>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-subtle">Product</p>
                <div className="mt-4 grid gap-2.5 text-sm">
                  <Link href="/login" className="text-muted-foreground transition hover:text-foreground">Sign in</Link>
                  <a href="https://github.com/SH20RAJ/ruxs" className="text-muted-foreground transition hover:text-foreground">GitHub</a>
                  <a href="mailto:hello@ruxs.in" className="text-muted-foreground transition hover:text-foreground">Contact</a>
                </div>
              </div>
            </div>

            <div className="mt-10 border-t border-border pt-6 text-[11px] text-subtle">
              © {new Date().getFullYear()} RUXS. Built for recurring local life.
            </div>
          </div>
        </footer>

        <nav aria-label="Mobile navigation" className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border bg-background/95 px-2 backdrop-blur-xl md:hidden">
          <Link href="/" className="text-xs font-medium text-muted-foreground">Home</Link>
          <Link href="/#services" className="text-xs font-medium text-muted-foreground">Services</Link>
          <Link href="/subscribe" className="rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground">Start</Link>
          <Link href="/#ledger" className="text-xs font-medium text-muted-foreground">Account</Link>
          <Link href="/vendor/onboard" className="text-xs font-medium text-muted-foreground">Vendors</Link>
        </nav>
      </body>
    </html>
  );
}
