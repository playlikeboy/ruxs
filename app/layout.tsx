import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { HexclaveProvider, HexclaveTheme } from "@hexclave/next";
import { hexclaveServerApp } from "@/src/hexclave/server";
import { PwaManager } from "./components/PwaManager";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { TopProgressBar } from "@/components/ui/TopProgressBar";
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
    default: "RUXS — Quiet Operating Layer for Recurring Local Household Services",
    template: "%s · RUXS",
  },
  description:
    "RUXS coordinates recurring local services — fresh A2 cow milk, 20L water cans, daily homestyle tiffin, morning puja flowers, dog walking, steam laundry passes & digital Khata — for apartment societies across India.",
  keywords: [
    "RUXS",
    "RUXS App",
    "recurring household services",
    "A2 milk subscription",
    "pure cow milk delivery",
    "20L water can delivery",
    "Bisleri water jar subscription",
    "daily tiffin service",
    "homestyle dabba delivery",
    "morning puja flower basket",
    "dog walking services",
    "doorstep steam iron and laundry",
    "digital khata",
    "apartment society delivery",
    "Bangalore household subscriptions",
    "HSR Layout milk delivery",
    "Bellandur water delivery",
  ],
  authors: [{ name: "RUXS", url: "https://ruxs.in" }],
  creator: "RUXS",
  publisher: "RUXS",
  category: "lifestyle",
  alternates: {
    canonical: "/",
  },
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
    title: "RUXS — Quiet Operating Layer for Recurring Local Household Services",
    description:
      "Recurring local services — milk, 20L water, meals, flowers, pet care & laundry — coordinated with zero morning follow-up and transparent digital Khata.",
    url: "https://ruxs.in/",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "RUXS — recurring household services, quietly handled",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RUXS — Quiet Operating Layer for Recurring Local Household Services",
    description:
      "Recurring local services — milk, 20L water, meals, flowers, pet care & laundry — coordinated with zero morning follow-up.",
    images: ["/twitter-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const rootStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://ruxs.in/#organization",
      name: "RUXS",
      url: "https://ruxs.in/",
      logo: "https://ruxs.in/icon.svg",
      sameAs: ["https://github.com/SH20RAJ/ruxs"],
      description:
        "The quiet operating layer for recurring local household services in India.",
    },
    {
      "@type": "WebSite",
      "@id": "https://ruxs.in/#website",
      url: "https://ruxs.in/",
      name: "RUXS",
      publisher: { "@id": "https://ruxs.in/#organization" },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://ruxs.in/app?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "WebApplication",
      "@id": "https://ruxs.in/#webapp",
      name: "RUXS App",
      url: "https://ruxs.in/app",
      applicationCategory: "LifestyleApplication",
      operatingSystem: "All",
      browserRequirements: "Requires JavaScript. Requires HTML5.",
      description:
        "Geofenced apartment society services app for 1-tap milk, 20L water cans, daily tiffin, flowers, pet care, laundry passes and live tracking.",
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("dark", geist.variable)}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(rootStructuredData) }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
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
