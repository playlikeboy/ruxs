import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomerUIProvider } from "@/src/modules/customer-ui";
import SearchClient from "./SearchClient";

export const metadata: Metadata = {
  title: "Search Daily Subscriptions, Society Food & Services | RUXS",
  description:
    "Search and order milk delivery, 20L water cans, homestyle tiffins, puja flowers, pet care, steam press passes, and verified society merchants in Bangalore.",
  keywords: [
    "search RUXS",
    "Bangalore milk delivery search",
    "water can subscription search",
    "society tiffin search",
    "pet walker Bangalore",
    "gated community delivery",
    "Sobha Classic",
    "Green Glen Layout",
  ],
  alternates: {
    canonical: "https://ruxs.in/app/search",
  },
  openGraph: {
    title: "Search Daily Subscriptions, Society Food & Services | RUXS",
    description:
      "Search and order milk delivery, 20L water cans, homestyle tiffins, puja flowers, pet care, steam press passes, and verified society merchants in Bangalore.",
    url: "https://ruxs.in/app/search",
    siteName: "RUXS",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Search RUXS Daily Subscriptions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Search Daily Subscriptions & Food Delivery | RUXS",
    description:
      "Search and order milk delivery, 20L water cans, homestyle tiffins, puja flowers, pet care, and verified society merchants in Bangalore.",
    images: ["/twitter-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const searchStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  url: "https://ruxs.in/app/search",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://ruxs.in/app/search?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export default function SearchPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(searchStructuredData) }}
      />
      <CustomerUIProvider>
        <Suspense
          fallback={
            <div className="min-h-screen bg-[#0b0f0d] flex items-center justify-center text-sm text-muted-foreground">
              Loading search...
            </div>
          }
        >
          <SearchClient />
        </Suspense>
      </CustomerUIProvider>
    </>
  );
}
