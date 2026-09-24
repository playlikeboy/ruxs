"use client";

import type { ServiceCategory } from "@/src/modules/customer-ui/types";
import { ServicesGridView } from "@/src/modules/customer-ui/components/ServicesGridView";

export default function ServicesPageClient({ categories }: { categories: ServiceCategory[] }) {
  return <ServicesGridView categories={categories} />;
}
