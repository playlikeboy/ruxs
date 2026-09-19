import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { HexclaveProvider, HexclaveTheme } from "@hexclave/next";
import { hexclaveServerApp } from "@/src/hexclave/server";
import { PwaManager } from "./components/PwaManager";
import { BrandLogo } from "@/components/brand/BrandLogo";
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
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml", sizes: "any" },
    ],
    shortcut: "/favicon.svg",
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml", sizes: "180x180" }],
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
    images: ["/twitter-image"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("dark", geist.variable)}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <PwaManager />
        <HexclaveProvider app={hexclaveServerApp}>
          <HexclaveTheme>
            {children}
          </HexclaveTheme>
        </HexclaveProvider>
      </body>
    </html>
  );
}
