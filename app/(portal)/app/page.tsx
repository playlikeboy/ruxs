import type { Metadata } from "next";
import AppClient from "./AppClient";

export const metadata: Metadata = {
  title: "RUXS App · Daily Household Subscriptions, Food & Local Services",
  description:
    "Explore geofenced apartment society merchants with 1-tap milk, water, tiffin, puja flowers, pet care, steam laundry passes, and live delivery tracking.",
  keywords: [
    "RUXS App",
    "society milk delivery",
    "20L water subscription",
    "daily tiffin dabba",
    "mandi puja flowers",
    "dog walking services",
    "doorstep steam press pass",
    "digital khata",
    "Bangalore society deliveries",
    "Sobha Classic",
    "Green Glen Layout",
  ],
  alternates: {
    canonical: "https://ruxs.in/app",
  },
  openGraph: {
    title: "RUXS App · Daily Household Subscriptions, Food & Local Services",
    description:
      "Explore geofenced apartment society merchants with 1-tap milk, water, tiffin, puja flowers, pet care, steam laundry passes, and live delivery tracking.",
    url: "https://ruxs.in/app",
    siteName: "RUXS",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "RUXS App · Daily Household Subscriptions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RUXS App · Daily Household Subscriptions & Food Delivery",
    description:
      "Explore geofenced apartment society merchants with 1-tap milk, water, tiffin, puja flowers, pet care, steam laundry, and live delivery tracking.",
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

const appStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://ruxs.in/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "RUXS App",
          item: "https://ruxs.in/app",
        },
      ],
    },
    {
      "@type": "WebApplication",
      name: "RUXS Customer App",
      url: "https://ruxs.in/app",
      applicationCategory: "LifestyleApplication",
      operatingSystem: "All",
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        reviewCount: "8420",
      },
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "INR",
        lowPrice: "15",
        highPrice: "7500",
        offerCount: "24",
      },
    },
  ],
};

export default function AppPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appStructuredData) }}
      />
      <AppClient />
    </>
  );
}
