"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatINR, Paise } from "@/src/shared/types/money";
import Link from "next/link";
import {
  Bell,
  MapPin,
  Clock,
  ArrowRight,
  Star,
  ShieldCheck,
  Plus,
  ShoppingBag,
  Sparkles,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { useCustomerUI } from "../context/CustomerUIContext";
import type { CatalogProduct, CatalogVendor, ServiceCategory } from "../types";
import { useUser } from "@hexclave/next";
import { CatalogSvgIllustration, CuteHeartSvg, CuteCatMascotSvg } from "../svg-assets";
import {
  DSCategoryPill,
  DSSearchBar,
  DSRatingPill,
} from "@/src/design-system";

export function DiscoveryView({
  products,
  vendors,
  categories,
}: {
  products: CatalogProduct[];
  vendors: CatalogVendor[];
  categories: ServiceCategory[];
}) {
  const router = useRouter();
  const {
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    openProductModal,
    unreadNotifCount,
    currentGeofence,
    routines,
    toggleRoutinePause,
    cartCount,
    totalPaise,
    setIsCartOpen,
  } = useCustomerUI();

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        activeCategory === "ALL" || p.category === activeCategory;
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery, products]);

  // Safe user profile resolution
  let displayName = "Neighbor";
  try {
    const user = useUser();
    if (user) {
      displayName =
        String(
          (user as any)?.firstName ||
            (user as any)?.name ||
            (user as any)?.fullName ||
            "Neighbor"
        );
    }
  } catch {
    displayName = "Neighbor";
  }

  const todayLabel = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date());

  const featuredVendor = vendors[0];

  return (
    <div className="mx-auto w-full max-w-md sm:max-w-xl lg:max-w-3xl px-4 pt-3 pb-32 text-ink font-sans space-y-6 select-none">
      {/* =====================================================================
          1. TOP LOCATION BAR & USER PROFILE (Airbnb header style)
         ===================================================================== */}
      <header className="flex items-center justify-between pt-1">
        {/* Current Society Location Pill */}
        <button
          type="button"
          onClick={() => router.push("/app/location")}
          className="flex items-center gap-3 text-left focus:outline-none group transition-opacity hover:opacity-90 cursor-pointer"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-coral/15 border border-coral/30 text-action shadow-xs">
            <MapPin size={20} className="fill-action text-action" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-action uppercase tracking-wider leading-none">
                Society Hub
              </span>
              <span className="h-1 w-1 rounded-full bg-coral" />
              <span className="text-[10px] font-semibold text-ink-muted">
                {currentGeofence.name || "Gate Pre-cleared"}
              </span>
            </div>
            <p className="mt-1 text-sm font-extrabold text-ink truncate max-w-[190px] sm:max-w-[280px]">
              {currentGeofence.societyName.split(",")[0]}
              {currentGeofence.city ? `, ${currentGeofence.city}` : ""}
            </p>
          </div>
        </button>

        {/* Right: Notifications & User Avatar */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/app/notifications")}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-raised text-ink-muted hover:text-ink hover:bg-surface-band transition-colors shadow-xs cursor-pointer"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadNotifCount > 0 && (
              <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-coral ring-2 ring-surface-raised" />
            )}
          </button>

          {/* User Profile / Digital Khata Link */}
          <Link
            href="/app/khata"
            className="h-10 w-10 shrink-0 rounded-full border border-border bg-surface-band overflow-hidden shadow-xs hover:border-action/40 transition-colors flex items-center justify-center"
            aria-label="Digital Khata profile"
          >
            <span className="text-xs font-black text-ink">
              {displayName.slice(0, 1).toUpperCase()}
            </span>
          </Link>
        </div>
      </header>

      {/* =====================================================================
          2. GREETING WITH CUTE MASCOT TOUCH
         ===================================================================== */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink font-display">
              Good morning, <span className="text-action">{displayName}</span>
            </h1>
            <CuteHeartSvg size={20} fill="#F2A4A4" />
          </div>
          <p className="mt-1 flex items-center gap-2 text-xs text-ink-muted font-medium">
            <span>{todayLabel}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1 text-[#2E7D32] font-bold">
              <CheckCircle2 size={12} />
              Gate Clearance Active
            </span>
          </p>
        </div>

        <div className="hidden sm:flex shrink-0">
          <CuteCatMascotSvg size={44} variant="happy" />
        </div>
      </div>

      {/* =====================================================================
          3. AIRBNB-INSPIRED FLOATING SEARCH PILL
         ===================================================================== */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          router.push(
            searchQuery
              ? `/app/search?q=${encodeURIComponent(searchQuery)}`
              : "/app/search"
          );
        }}
      >
        <DSSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search fresh milk, water jar, dabba tiffin, flowers..."
          onFilterClick={() => router.push("/app/location")}
        />
      </form>

      {/* =====================================================================
          4. CATEGORIES HORIZONTAL CAROUSEL
         ===================================================================== */}
      <div>
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <DSCategoryPill
              key={cat.id}
              id={cat.id}
              label={cat.label}
              icon={cat.id}
              count={cat.count}
              isActive={activeCategory === cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                router.replace(`/app?category=${encodeURIComponent(cat.id)}`);
              }}
            />
          ))}
        </div>
      </div>

      {/* =====================================================================
          5. FEATURED SOCIETY MERCHANT (Airbnb Host Card style)
         ===================================================================== */}
      {featuredVendor && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold tracking-tight text-ink font-display">
              Featured Society Partner
            </h2>
            <Link
              href="/app/services"
              className="text-xs font-bold text-action hover:underline"
            >
              See all
            </Link>
          </div>

          <Link
            href={`/app/vendor/${featuredVendor.id}`}
            className="group relative block w-full overflow-hidden rounded-3xl border border-border bg-surface-raised shadow-card transition-all hover:border-border-strong hover:shadow-soft"
          >
            {/* Banner Image / Luxury Illustration Cover */}
            <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-surface-band">
              <img
                src={featuredVendor.bannerImage || featuredVendor.image}
                alt={featuredVendor.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/30" />

              {/* Top Badges on Banner */}
              <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-ink shadow-xs backdrop-blur-md">
                  <ShieldCheck size={14} className="text-[#2E7D32]" />
                  <span>{featuredVendor.badge || "Verified Society Merchant"}</span>
                </div>

                <span className="rounded-full bg-coral px-3 py-1 text-xs font-bold text-white shadow-xs">
                  {featuredVendor.openingHours || "Scheduled Daily"}
                </span>
              </div>

              {/* Bottom Frosted Card Banner */}
              <div className="absolute bottom-3 left-3 right-3 rounded-2xl border border-border/60 bg-surface-raised/95 p-3.5 backdrop-blur-xl shadow-md flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <h3 className="text-base font-bold text-ink truncate font-display">
                    {featuredVendor.name}
                  </h3>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-muted">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-action shrink-0" />
                      <span className="truncate">{featuredVendor.address.split(",")[0]}</span>
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1 font-bold text-[#B45309] shrink-0">
                      <Star size={12} className="fill-[#F59E0B] text-[#F59E0B]" />
                      <span>{featuredVendor.rating.toFixed(1)}</span>
                    </span>
                  </div>
                </div>

                <div className="h-9 w-9 shrink-0 rounded-full bg-action text-white shadow-xs flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                  <ArrowRight size={15} />
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* =====================================================================
          6. POPULAR DISHES & ITEMS (Airbnb Listing Grid)
         ===================================================================== */}
      <div>
        <div className="mb-3.5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight text-ink font-display">
              Popular Society Essentials
            </h2>
            <p className="text-xs text-ink-muted">
              Pre-cleared morning doorstep drops in {currentGeofence.societyName.split(",")[0]}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveCategory("ALL")}
            className="text-xs font-bold text-action hover:underline cursor-pointer"
          >
            View All
          </button>
        </div>

        {/* 2-Column Responsive Product Cards Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          {filteredProducts.map((product) => (
            <Link
              key={product.id}
              href={`/app/product/${product.id}`}
              className="group flex flex-col justify-between rounded-3xl border border-border bg-surface-raised p-3.5 sm:p-4 shadow-card transition-all hover:border-border-strong hover:shadow-soft"
            >
              <div>
                {/* Product Image / Cute Pastel Container */}
                <div className="relative mx-auto flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center my-1 rounded-2xl bg-surface-band border border-border overflow-hidden">
                  {product.image && product.image !== "/icon.svg" ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cat-yellow/20 via-surface-raised to-cat-blue/20 p-3">
                      <CatalogSvgIllustration idOrCategory={product.category} size={54} />
                    </div>
                  )}

                  {/* Micro Category Pill */}
                  <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-surface-raised border border-border p-0.5 shadow-xs flex items-center justify-center">
                    <CatalogSvgIllustration idOrCategory={product.category} size={18} />
                  </div>

                  {product.isBestSeller && (
                    <span className="absolute top-1 right-1 rounded-full bg-coral px-2 py-0.5 text-[9px] font-bold text-white shadow-xs">
                      TOP
                    </span>
                  )}
                </div>

                {/* Title & Vendor */}
                <div className="mt-3">
                  <h3 className="text-sm font-bold text-ink line-clamp-1 group-hover:text-action transition-colors font-display">
                    {product.name}
                  </h3>
                  <p className="text-[11px] text-ink-muted line-clamp-1 mt-0.5">
                    {product.vendorName}
                  </p>
                </div>

                {/* Price (Integer Paise formatted) */}
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-base font-extrabold text-ink">
                    {formatINR(product.pricePaise as Paise)}
                  </span>
                  {product.originalPricePaise && (
                    <span className="text-xs text-ink-subtle line-through">
                      {formatINR(product.originalPricePaise as Paise)}
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Meta & Action Button (+) */}
              <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] text-ink-muted font-semibold">
                  <Clock size={11} className="text-coral" />
                  <span className="truncate max-w-[85px] sm:max-w-[110px]">
                    {product.deliveryWindow || "Morning 6–8 AM"}
                  </span>
                </div>

                {/* 1-tap Add Button (+) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openProductModal(product);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-action text-white shadow-xs hover:bg-action-hover active:scale-95 transition-all cursor-pointer"
                  aria-label={`Add ${product.name}`}
                >
                  <Plus size={16} className="stroke-[3]" />
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* =====================================================================
          7. MORE NEARBY SOCIETY VENDORS
         ===================================================================== */}
      <div>
        <div className="mb-3.5 flex items-center justify-between">
          <h2 className="text-base font-bold tracking-tight text-ink font-display">
            More Society Vendors
          </h2>
          <span className="text-xs font-bold text-[#2E7D32]">Pre-cleared Gate Pass</span>
        </div>

        <div className="space-y-3">
          {vendors.slice(1, 5).map((vendor) => (
            <Link
              key={vendor.id}
              href={`/app/vendor/${vendor.id}`}
              className="flex items-center justify-between rounded-2xl border border-border bg-surface-raised p-3 shadow-card hover:border-border-strong hover:bg-surface-band transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-14 w-14 rounded-xl bg-surface-band border border-border overflow-hidden shrink-0">
                  <img
                    src={vendor.image}
                    alt={vendor.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-ink truncate font-display">
                    {vendor.name}
                  </h3>
                  <p className="text-xs text-ink-muted truncate mt-0.5">
                    {vendor.address.split(",")[0]}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-ink-muted font-medium">
                    <span className="flex items-center gap-0.5 font-bold text-[#B45309]">
                      <Star size={11} className="fill-[#F59E0B] text-[#F59E0B]" />
                      {vendor.rating.toFixed(1)}
                    </span>
                    <span>·</span>
                    <span className="truncate">{vendor.deliveryWindow}</span>
                  </div>
                </div>
              </div>

              <div className="h-8 w-8 shrink-0 rounded-full bg-surface-band border border-border text-ink-muted flex items-center justify-center">
                <ArrowRight size={14} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* =====================================================================
          8. ACTIVE HOUSEHOLD ROUTINES OR ONBOARDING PROMPT
         ===================================================================== */}
      {routines.length > 0 ? (
        <div className="rounded-3xl border border-border bg-surface-raised p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-coral/15 text-action">
                <ShieldCheck size={16} />
              </div>
              <h2 className="text-sm font-bold text-ink font-display">
                Active Household Routines ({routines.length})
              </h2>
            </div>
            <span className="text-[11px] font-bold text-[#2E7D32] bg-[#E8F5E9] px-2.5 py-0.5 rounded-full border border-[#2E7D32]/20">
              Autopilot Active
            </span>
          </div>

          <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
            {routines.map((routine) => (
              <div
                key={routine.id}
                className="flex items-center justify-between rounded-2xl border border-border bg-surface-band p-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-surface-raised overflow-hidden shrink-0 border border-border">
                    <img
                      src={routine.image}
                      alt={routine.productName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-ink truncate">
                      {routine.productName}
                    </p>
                    <p className="text-[10px] text-ink-muted truncate">
                      {routine.nextDelivery}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleRoutinePause(routine.id)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                    routine.status === "ACTIVE"
                      ? "bg-surface-raised border border-border text-ink hover:bg-surface-subtle"
                      : "bg-action text-white hover:bg-action-hover"
                  }`}
                >
                  {routine.status === "ACTIVE" ? "Pause" : "Resume"}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-gradient-to-br from-surface-raised via-surface to-canvas-soft/20 p-5 shadow-card flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-coral/15 border border-coral/30 text-action">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-ink font-display">
                Set and Forget Daily Deliveries
              </h3>
              <p className="mt-0.5 text-[11px] text-ink-muted">
                Tap (+) on milk, water, or meals to start a recurring morning routine.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push("/app/services")}
            className="shrink-0 rounded-full bg-surface-raised border border-border px-3.5 py-1.5 text-xs font-bold text-ink hover:bg-surface-band transition-colors cursor-pointer shadow-xs"
          >
            Explore
          </button>
        </div>
      )}

      {/* =====================================================================
          9. FLOATING CART ACTION PILL (Airbnb Floating Bar Style)
         ===================================================================== */}
      {cartCount > 0 && (
        <aside
          aria-label="Active cart checkout bar"
          className="fixed inset-x-1/2 bottom-20 z-40 flex w-[min(calc(100vw-32px),480px)] -translate-x-1/2 items-center justify-between rounded-full border border-action/40 bg-action px-5 py-3 text-white shadow-pill backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
              <ShoppingBag size={15} />
            </div>
            <span className="text-xs font-extrabold">
              {cartCount} {cartCount === 1 ? "item" : "items"} · {formatINR(totalPaise as Paise)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-1 text-xs font-black hover:underline cursor-pointer"
          >
            <span>View Cart</span>
            <ArrowRight size={14} />
          </button>
        </aside>
      )}
    </div>
  );
}
