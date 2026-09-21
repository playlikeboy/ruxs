"use client";

import React from "react";
import { CustomerUIProvider, useCustomerUI } from "../context/CustomerUIContext";
import { DiscoveryView } from "./DiscoveryView";
import { ProductDetailModal } from "./ProductDetailModal";
import { CartDrawer } from "./CartDrawer";
import { TrackingView } from "./TrackingView";
import { NotificationsModal } from "./NotificationsModal";
import { GeofenceModal } from "./GeofenceModal";
import { ServicesGridView } from "./ServicesGridView";
import { KhataProfileView } from "./KhataProfileView";
import { DSBottomNav } from "@/src/design-system";

function MainAppContent() {
  const { activeTab, setActiveTab, cartCount, setIsCartOpen } = useCustomerUI();

  const handleTabChange = (tab: any) => {
    if (tab === "cart") {
      setIsCartOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0b0d0c] text-foreground">
      {/* Background ambient lighting */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 h-[500px] w-[650px] rounded-full bg-emerald-500/[0.04] blur-[120px]" />
      </div>

      {/* Main Responsive Canvas */}
      <main className="relative mx-auto w-full max-w-xl px-4 pt-3 sm:px-6 sm:pt-6">
        {activeTab === "home" && <DiscoveryView />}
        {activeTab === "favorites" && <ServicesGridView />}
        {activeTab === "tracking" && <TrackingView />}
        {activeTab === "profile" && <KhataProfileView />}
      </main>

      {/* Persistent Floating Bottom Dock (Screen 1 & 2) */}
      <DSBottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        cartCount={cartCount}
      />

      {/* Modals & Slide Drawers */}
      <ProductDetailModal />
      <CartDrawer />
      <NotificationsModal />
      <GeofenceModal />
    </div>
  );
}

export function CustomerAppContainer() {
  return (
    <CustomerUIProvider>
      <MainAppContent />
    </CustomerUIProvider>
  );
}
