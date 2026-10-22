import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#FFF3E9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://ruxs.in"),
  applicationName: "RUXs",
  title: { default: "RUXs — Local Services for Everyday Life", template: "%s | RUXs" },
  description: "Discover neighbourhood meals, water and dairy delivery, kids' learning and activities, DIY kits, gifts, mehndi artists, fitness and physiotherapy.",
  keywords: [
    "local services", "tiffin service", "20L water can delivery", "fresh milk and dairy delivery",
    "neighbourhood grocery stores", "kids tutoring", "kids robotics and STEM classes",
    "kids coding classes", "kids chess academy", "kids art and pottery", "kids dance and music classes",
    "holiday camps for children", "DIY learning kits", "school project materials", "mehndi artist",
    "henna designer", "custom gifts", "fitness trainer", "physiotherapist", "recurring household services", "Ranchi",
  ],
  icons: {
    icon: [{ url: "/brand/ruxs-app-icon.svg", type: "image/svg+xml", sizes: "512x512" }],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
    shortcut: ["/brand/ruxs-app-icon.svg"],
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "RUXs" },
  formatDetection: { telephone: false },
  openGraph: {
    title: "RUXs — Local Services for Everyday Life",
    description: "Meals, water and dairy, kids' classes and camps, gifts, mehndi artists and wellness providers from your neighbourhood.",
    url: "https://ruxs.in",
    siteName: "RUXs",
    locale: "en_IN",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "RUXs — local services for everyday life, kids and home" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "RUXs — Local Services for Everyday Life",
    description: "Discover neighbourhood essentials, kids' learning, gifts and local specialists with RUXs.",
    images: ["/opengraph-image"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication", "@id": "https://ruxs.in/#app", name: "RUXs", url: "https://ruxs.in",
      applicationCategory: "ShoppingApplication", operatingSystem: "All", browserRequirements: "Requires JavaScript. Requires HTML5.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
    },
    {
      "@type": "Organization", "@id": "https://ruxs.in/#organization", name: "RUXs", url: "https://ruxs.in",
      logo: "https://ruxs.in/brand/ruxs-app-logo.svg", sameAs: ["https://twitter.com/ruxs_in", "https://github.com/SH20RAJ/ruxs"],
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN">
      <head><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /></head>
      <body className={geistSans.variable + " " + geistMono.variable + " min-h-screen bg-bg text-ink antialiased"}>{children}</body>
    </html>
  );
}
