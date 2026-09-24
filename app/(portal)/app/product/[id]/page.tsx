import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatINR, Paise } from "@/src/shared/types/money";
import {
  getCustomerProductById,
  getCustomerVendorById,
  getCustomerProductsByVendor,
} from "@/src/modules/customer-ui/catalog-service";
import ProductDetailClient from "./ProductDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getCustomerProductById(id);

  if (!product) {
    return {
      title: "Product Not Found | RUXS",
      description: "The requested subscription product could not be found.",
    };
  }

  const priceStr = formatINR(product.pricePaise as Paise);
  const title = `${product.name} (${priceStr}) · ${product.vendorName} | RUXS`;
  const description = `${product.description} Available for doorstep delivery and recurring household routines through RUXS.`;
  const canonicalUrl = `https://ruxs.in/app/product/${product.id}`;

  return {
    title,
    description,
    keywords: [
      product.name,
      product.vendorName,
      product.category,
      "daily subscription",
      "society delivery",
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
          url: product.image,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [product.image],
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

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getCustomerProductById(id);

  if (!product) {
    notFound();
  }

  const vendor = await getCustomerVendorById(product.vendorId);
  if (!vendor) {
    notFound();
  }

  const relatedProducts = (await getCustomerProductsByVendor(product.vendorId))
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.image,
    description: product.description,
    brand: {
      "@type": "Brand",
      name: product.vendorName,
    },
    offers: {
      "@type": "Offer",
      url: `https://ruxs.in/app/product/${product.id}`,
      priceCurrency: "INR",
      price: (product.pricePaise / 100).toFixed(2),
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: product.vendorName,
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
      bestRating: "5",
      worstRating: "1",
    },
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
        name: product.name,
        item: `https://ruxs.in/app/product/${product.id}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProductDetailClient product={product} vendor={vendor} relatedProducts={relatedProducts} />
    </>
  );
}
