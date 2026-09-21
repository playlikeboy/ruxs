import type { Metadata } from "next";
import VendorOnboardClient from "./VendorOnboardClient";

export const metadata: Metadata = {
  title: "Vendor Partner Onboarding · Connect with Apartment Societies · RUXS",
  description:
    "Join RUXS as a verified local service merchant for milk, 20L water cans, daily tiffin, flowers, pet care, or laundry. Expand recurring customer base across gated communities.",
  keywords: [
    "vendor onboarding",
    "milk vendor software",
    "water supplier app",
    "tiffin service delivery software",
    "society vendor partner",
    "apartment vendor platform",
  ],
  alternates: { canonical: "https://ruxs.in/vendor/onboard" },
  openGraph: {
    title: "Vendor Partner Onboarding · Connect with Apartment Societies · RUXS",
    description:
      "Join RUXS as a verified local service merchant. Expand your daily recurring customer deliveries with zero commissions.",
    url: "https://ruxs.in/vendor/onboard",
    siteName: "RUXS",
  },
  robots: { index: true, follow: true },
};

const vendorStructuredData = {
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
          name: "Vendor Onboarding",
          item: "https://ruxs.in/vendor/onboard",
        },
      ],
    },
    {
      "@type": "Service",
      name: "RUXS Vendor Network",
      provider: {
        "@type": "Organization",
        name: "RUXS",
        url: "https://ruxs.in/",
      },
      description:
        "Digital operating layer for local vendors running recurring doorstep deliveries in Indian apartment societies.",
    },
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(vendorStructuredData) }}
      />
      <VendorOnboardClient />
    </>
  );
}
