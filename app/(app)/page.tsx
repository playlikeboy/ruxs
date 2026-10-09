import type { Metadata } from "next";
import { safeJsonLdStringify } from "@/src/shared/utils/security";
import {
  ImpeccableHeader,
  ImpeccableHero,
  ImpeccableCommandConsole,
  ImpeccableSteering,
  ImpeccableBento,
  ImpeccableTestimonials,
  ImpeccableFaq,
  ImpeccableFooter,
} from "@/components/landing/impeccable";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "RUXS — Recurring Household Life, Quietly Handled | Impeccable Society Logistics",
  description:
    "RUXS is the quiet operating layer for recurring daily services in apartment societies. 1-tap fresh milk, 20L water cans, homestyle tiffins, morning puja flowers, pet care, steam iron passes, and transparent digital Khata.",
  alternates: { canonical: "https://ruxs.in/" },
  openGraph: {
    title: "RUXS — Recurring Household Life, Quietly Handled",
    description:
      "A quiet operating system for recurring household services in India. Fresh milk, 20L water cans, daily tiffins, flowers, pet walks, and laundry with transparent billing.",
    url: "https://ruxs.in/",
    siteName: "RUXS",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "RUXS — Recurring Household Services on Autopilot",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RUXS — Recurring Household Life, Quietly Handled",
    description:
      "Recurring daily services — milk, water, meals, flowers, pet care & laundry — coordinated with zero morning follow-up.",
    images: ["/twitter-image"],
  },
};

export default function LandingPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://ruxs.in/#organization",
        name: "RUXS Technologies",
        url: "https://ruxs.in",
        logo: "https://ruxs.in/icon-512.png",
        sameAs: [
          "https://twitter.com/ruxs_in",
          "https://linkedin.com/company/ruxs",
        ],
        description:
          "Operating system for recurring household services in apartment societies and gated communities.",
      },
      {
        "@type": "WebSite",
        "@id": "https://ruxs.in/#website",
        url: "https://ruxs.in",
        name: "RUXS",
        publisher: { "@id": "https://ruxs.in/#organization" },
      },
      {
        "@type": "SoftwareApplication",
        name: "RUXS App",
        operatingSystem: "Web, iOS, Android (PWA)",
        applicationCategory: "LifestyleApplication",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "INR",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "How does RUXS work without ringing my doorbell at 06:00 AM?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "RUXS establishes designated drop zones with your society security and your apartment door (e.g. your milk basket, door hook, or shoe-rack crate). Delivery runners follow a silent checklist and drop items between 05:30 AM and 06:15 AM.",
            },
          },
          {
            "@type": "Question",
            name: "What happens if I need to pause or change my order at the last minute?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "You have until 10:00 PM (22:00 IST) every night to make adjustments. Simply reply 'PAUSE' or '+1 packet' on WhatsApp, or toggle it in the web app. At 10:00 PM, the manifest locks so vendors can procure exact fresh supplies.",
            },
          },
          {
            "@type": "Question",
            name: "Can our society bring our trusted existing milkman, ironman, and coconut vendor?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes! RUXS is not a supermarket aggregator that replaces local vendors with dark stores. We digitize your existing trusted neighborhood vendors, giving them automated WhatsApp orders, aggregated batch manifests, and guaranteed digital payments.",
            },
          },
          {
            "@type": "Question",
            name: "How do RUXS delivery runners pass gated security?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "RUXS creates verified digital Gate Run Passes for each tower. Instead of 40 separate intercom calls to residents at 06:00 AM, security guards scan one batch roster QR code. The runner ascends to the top floor once and delivers downward in 18 minutes.",
            },
          },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[var(--c-canvas)] text-[var(--c-text-primary)] selection:bg-[var(--c-accent)] selection:text-white">
      {/* Sanitized SEO JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLdStringify(structuredData),
        }}
      />

      {/* Component 1: Impeccable Fixed Header */}
      <ImpeccableHeader />

      <main className="relative pt-16">
        {/* Component 2: Hero Section & Interactive Proof Comparison Slider */}
        <ImpeccableHero />

        {/* Component 3: Routine Command Console Deck */}
        <ImpeccableCommandConsole />

        {/* Component 4: Split Live Simulator (WhatsApp Chat & Society Run Sheet) */}
        <ImpeccableSteering />

        {/* Component 5: Architectural Bento Grid */}
        <ImpeccableBento />

        {/* Component 6: Plinth Cards / Society & Vendor Testimonials */}
        <ImpeccableTestimonials />

        {/* Component 7: Anti-Slop FAQ Accordion */}
        <ImpeccableFaq />
      </main>

      {/* Component 8: Tactile Launch & Status Footer */}
      <ImpeccableFooter />
    </div>
  );
}
