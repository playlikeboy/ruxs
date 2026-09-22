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
    <div className="relative min-h-screen bg-[#FBF9F7] text-gray-950 font-sans selection:bg-red-100 selection:text-red-900">
      {/* Main Responsive Canvas */}
      <main className="relative mx-auto w-full max-w-xl px-4 pt-3 sm:px-6 sm:pt-6">
        {activeTab === "home" && <DiscoveryView />}
        {activeTab === "favorites" && <ServicesGridView />}
        {activeTab === "tracking" && <TrackingView />}
        {activeTab === "profile" && <KhataProfileView />}
      </main>

      {/* Persistent Floating Bottom Dock */}
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
