import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#FAFAF7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://ruxs.in"),
  applicationName: "RUXs",
  title: {
    default: "RUXs — Everyday Essentials From Your Neighbourhood",
    template: "%s | RUXs",
  },
  description:
    "Discover neighbourhood tiffin subscriptions, 20L water-can delivery, fresh dairy, mehndi artists, and custom gifts with local doorstep service.",
  keywords: [
    "tiffin service",
    "20L water can delivery",
    "fresh milk delivery",
    "mehndi artist",
    "henna designer",
    "custom gifts",
    "daily subscription",
    "home kitchen",
    "Ranchi",
    "household services",
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RUXs",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "RUXs — Everyday Essentials From Your Neighbourhood",
    description:
      "Daily tiffin subscriptions, 20L water, fresh dairy, mehndi designers, and custom gifts from trusted local neighbourhood stores.",
    url: "https://ruxs.in",
    siteName: "RUXs",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RUXs — Everyday Essentials From Your Neighbourhood",
    description: "Daily tiffin, water, dairy, mehndi artists & local gifts delivered to your doorstep.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": "https://ruxs.in/#app",
      "name": "RUXs",
      "url": "https://ruxs.in",
      "applicationCategory": "ShoppingApplication",
      "operatingSystem": "All",
      "browserRequirements": "Requires JavaScript. Requires HTML5.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "INR",
      },
    },
    {
      "@type": "Organization",
      "@id": "https://ruxs.in/#organization",
      "name": "RUXs",
      "url": "https://ruxs.in",
      "logo": "https://ruxs.in/icon",
      "sameAs": ["https://twitter.com/ruxs_in", "https://github.com/SH20RAJ/ruxs"],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-bg text-ink antialiased`}>
        {children}
      </body>
    </html>
  );
}
