import type { Metadata } from "next";
import { getCustomerCatalog } from "@/src/modules/customer-ui/catalog-service";
import ServicesPageClient from "./ServicesPageClient";

export const metadata: Metadata = {
  title: "Services | RUXS",
  description: "Browse the recurring household services currently available from verified RUXS merchants.",
  alternates: { canonical: "https://ruxs.in/app/services" },
  robots: { index: true, follow: true },
};

export default async function ServicesPage() {
  const catalog = await getCustomerCatalog();
  return <ServicesPageClient categories={catalog.categories} />;
}
