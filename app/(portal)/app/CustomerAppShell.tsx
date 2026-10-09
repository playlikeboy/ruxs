"use client";

import type { ReactNode } from "react";
import { CustomerUIProvider, useCustomerUI } from "@/src/modules/customer-ui";
import {
  CartDrawer,
  GeofenceModal,
  NotificationsModal,
  ProductDetailModal,
} from "@/src/modules/customer-ui";
import { DSBottomNav } from "@/src/design-system";

function CustomerAppNavigation() {
  const { activeTab, cartCount } = useCustomerUI();
  return <DSBottomNav activeTab={activeTab} cartCount={cartCount} />;
}

export function CustomerAppShell({ children }: { children: ReactNode }) {
  return (
    <CustomerUIProvider>
      <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20">
        {children}
        <CustomerAppNavigation />
        <ProductDetailModal />
        <CartDrawer />
        <NotificationsModal />
        <GeofenceModal />
      </div>
    </CustomerUIProvider>
  );
}
