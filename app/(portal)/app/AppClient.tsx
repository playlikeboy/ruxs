"use client";

import React from "react";
import { DiscoveryView } from "@/src/modules/customer-ui/components/DiscoveryView";
import { useCustomerUI } from "@/src/modules/customer-ui";

export default function AppClient() {
  const { activeCategory } = useCustomerUI();
  return <DiscoveryView initialCategory={activeCategory} />;
}
