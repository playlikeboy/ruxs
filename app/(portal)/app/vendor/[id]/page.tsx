import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getVendorById,
  getProductsByVendor,
  MOCK_VENDORS,
} from "@/src/modules/customer-ui";
import VendorDetailClient from "./VendorDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return MOCK_VENDORS.map((v) => ({
    id: v.id,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const vendor = getVendorById(id);

  if (!vendor) {
    return {
      title: "Vendor Not Found | RUXS",
      description: "The requested society merchant could not be found.",
    };
  }

  const title = `${vendor.name} · Verified Society Merchant | RUXS`;
  const description = `${vendor.description} Serving ${vendor.societiesCovered.join(", ")} with doorstep delivery and autopilot subscriptions.`;
  const canonicalUrl = `https://ruxs.in/app/vendor/${vendor.id}`;

  return {
    title,
    description,
    keywords: [
      vendor.name,
      vendor.category,
      ...vendor.societiesCovered,
      "society merchant",
      "Bangalore daily delivery",
      "FSSAI verified",
      "RUXS",
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "RUXS",
      type: "website",
      images: [
        {
          url: vendor.bannerImage || vendor.image,
          width: 1200,
          height: 630,
          alt: vendor.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [vendor.bannerImage || vendor.image],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
      },
    },
  };
}

export default async function VendorPage({ params }: PageProps) {
  const { id } = await params;
  const vendor = getVendorById(id);

  if (!vendor) {
    notFound();
  }

  const products = getProductsByVendor(vendor.id);

  const vendorJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: vendor.name,
    image: vendor.image,
    telephone: vendor.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: vendor.address,
      addressLocality: "Bengaluru",
      addressRegion: "KA",
      addressCountry: "IN",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: vendor.rating,
      reviewCount: vendor.reviewCount,
      bestRating: "5",
      worstRating: "1",
    },
    priceRange: "$$",
    openingHours: vendor.openingHours,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://ruxs.in",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "App",
        item: "https://ruxs.in/app",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: vendor.name,
        item: `https://ruxs.in/app/vendor/${vendor.id}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(vendorJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <VendorDetailClient vendor={vendor} products={products} />
      </CustomerUIProvider>
    </>
  );
}
