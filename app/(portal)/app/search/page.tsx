import type { Metadata } from "next";
import { Suspense } from "react";
import { getCustomerCatalog } from "@/src/modules/customer-ui/catalog-service";
import SearchClient from "./SearchClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search Daily Subscriptions, Society Food & Services | RUXS",
  description:
    "Search live RUXS marketplace products and verified local household service providers.",
  alternates: {
    canonical: "https://ruxs.in/app/search",
  },
  robots: {
    index: true,
    follow: true,
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

export default async function SearchPage() {
  const catalog = await getCustomerCatalog();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(searchStructuredData) }}
      />
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-[#0b0f0d] text-sm text-muted-foreground">
            Loading search...
          </div>
        }
      >
        <SearchClient catalog={catalog} />
      </Suspense>
    </>
  );
}
