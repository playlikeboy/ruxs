"use client";

import type { CustomerCatalog } from "@/src/modules/customer-ui/types";
import { DiscoveryView } from "@/src/modules/customer-ui/components/DiscoveryView";

export default function AppClient({ catalog }: { catalog: CustomerCatalog }) {
  return (
    <DiscoveryView
      products={catalog.products}
      vendors={catalog.vendors}
      categories={catalog.categories}
    />
  );
}
