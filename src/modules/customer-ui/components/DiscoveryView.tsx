"use client";

import React, { useMemo } from "react";
import { formatINR, Paise } from "@/src/shared/types/money";
import Link from "next/link";
import {
  Bell,
  SlidersHorizontal,
  MapPin,
  Clock,
  Plus,
  ArrowRight,
  Search as SearchIcon,
  Star,
  ShieldCheck,
} from "lucide-react";
import { useCustomerUI } from "../context/CustomerUIContext";
import type { CatalogProduct, CatalogVendor, ServiceCategory } from "../types";
import { useUser } from "@hexclave/next";
import { CatalogSvgIllustration } from "../svg-assets";
import {
  DSCard,
  DSCategoryPill,
  DSSearchBar,
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
  const {
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    openProductModal,
    unreadNotifCount,
    setIsNotificationsOpen,
    currentGeofence,
    setIsGeofenceModalOpen,
    routines,
    toggleRoutinePause,
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

  // Featured vendor for the Screen 1 "Asian Kitchen" card layout
  const user = useUser();
  const displayName = String((user as any)?.firstName || (user as any)?.name || (user as any)?.fullName || "there");
  const todayLabel = new Intl.DateTimeFormat("en-IN", { weekday: "long", month: "short", day: "numeric" }).format(new Date());
  const featuredVendor = vendors[0];

  return (
    <div className="space-y-6 pb-24 text-gray-900 font-sans">
      {/* =====================================================================
          1. TOP LOCATION BAR & USER PROFILE (Screen 1)
         ===================================================================== */}
      <header className="flex items-center justify-between pt-1">
        {/* Current Location Pill */}
        <button
          type="button"
          onClick={() => setIsGeofenceModalOpen(true)}
          className="flex items-center gap-3 text-left focus:outline-none"
        >
          {/* Squircle Location Icon */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 border border-red-100 text-red-500 shadow-xs">
            <MapPin size={20} className="fill-red-500 text-red-500" />
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-medium text-gray-400 leading-none">
              Current Location
            </p>
            <p className="mt-1 text-sm font-bold text-gray-900 truncate max-w-[190px] sm:max-w-[260px]">
              {currentGeofence.societyName.split(",")[0]}{currentGeofence.city ? `, ${currentGeofence.city}` : ""}
            </p>
          </div>
        </button>

        {/* Right: Notifications & User Avatar */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(true)}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 shadow-xs"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadNotifCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-red-500" />
            )}
          </button>

          {/* User Avatar */}
          <div className="h-10 w-10 shrink-0 rounded-full border border-gray-200 overflow-hidden shadow-xs">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
              alt="User"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </header>

      {/* =====================================================================
          2. GREETING HEADER (Screen 1)
         ===================================================================== */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-950">
          Hello! <span className="font-extrabold text-red-500">{displayName}</span>
        </h1>
        <p className="mt-0.5 text-xs text-gray-400 font-medium">
          {todayLabel} · Today
        </p>
      </div>

      {/* =====================================================================
          3. SEARCH BAR WITH CORAL FILTER BUTTON (Screen 1)
         ===================================================================== */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          window.location.href = searchQuery
            ? `/app/search?q=${encodeURIComponent(searchQuery)}`
            : "/app/search";
        }}
      >
        <DSSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search your place here"
          onFilterClick={() => setIsGeofenceModalOpen(true)}
        />
      </form>

      {/* =====================================================================
          4. CATEGORIES HORIZONTAL SQUIRCLES (Screen 1 - Zero Emojis)
         ===================================================================== */}
      <div>
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <DSCategoryPill
              key={cat.id}
              id={cat.id}
              label={cat.label}
              icon={cat.id}
              isActive={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
            />
          ))}
        </div>
      </div>

      {/* =====================================================================
          5. NEARBY RESTAURANTS / VENDORS (Screen 1 - "Asian Kitchen" Card)
         ===================================================================== */}
      <div>
        <div className="mb-3.5 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-gray-950">
            Nearby services
          </h2>
          <button
            type="button"
            onClick={() => setActiveCategory("ALL")}
            className="text-xs font-semibold text-gray-500 hover:text-red-500"
          >
            View all
          </button>
        </div>

        {/* Featured Big Card matching Screen 1 "Asian Kitchen" */}
        {featuredVendor && (
          <Link
            href={`/app/vendor/${featuredVendor.id}`}
            className="group relative block w-full overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm"
          >
            {/* Banner Image */}
            <div className="relative h-56 sm:h-64 w-full">
              <img
                src={featuredVendor.bannerImage || featuredVendor.image}
                alt={featuredVendor.name}
                className="h-full w-full object-cover"
              />

              {/* Top Bar on Card: User Avatar badge + Red "Open now" pill */}
              <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-full bg-white/90 px-2.5 py-1 shadow-xs backdrop-blur-md">
                  <ShieldCheck size={13} className="text-emerald-600" />
                  <span className="text-[11px] font-semibold text-gray-800">
                    {featuredVendor.badge || "Verified merchant"}
                  </span>
                </div>

                <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-xs">
                  Open now
                </span>
              </div>

              {/* Bottom Frosted Glass Card Banner from Screen 1 */}
              <div className="absolute bottom-3 left-3 right-3 rounded-2xl border border-white/40 bg-white/80 p-3.5 backdrop-blur-lg shadow-sm flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <h3 className="text-base font-bold text-gray-950 truncate">
                    {featuredVendor.name}
                  </h3>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-red-500 shrink-0" />
                      <span className="truncate">{featuredVendor.address.split(",")[0]}</span>
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-gray-800 shrink-0">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span>{featuredVendor.rating} ratings ({featuredVendor.reviewCount})</span>
                    </span>
                  </div>
                </div>

                {/* White Circular Action Button on Right */}
                <div className="h-9 w-9 shrink-0 rounded-full bg-white text-gray-800 shadow-sm flex items-center justify-center border border-gray-200">
                  <ArrowRight size={15} />
                </div>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* =====================================================================
          6. LIST OF FOOD & PRODUCTS (Grid / Cards)
         ===================================================================== */}
      <div>
        <div className="mb-3.5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-gray-950">
              Popular Dishes & Items
            </h2>
            <p className="text-xs text-gray-400">
              Fresh daily doorstep options in {currentGeofence.societyName.split(",")[0]}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveCategory("ALL")}
            className="text-xs font-semibold text-gray-500 hover:text-red-500"
          >
            See All
          </button>
        </div>

        {/* 2-Column Clean White Product Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <Link
              key={product.id}
              href={`/app/product/${product.id}`}
              className="flex flex-col justify-between rounded-3xl border border-gray-100 bg-white p-3.5 sm:p-4 shadow-xs select-none"
            >
              <div>
                {/* Circular Product Image */}
                <div className="relative mx-auto flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center my-1">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full rounded-2xl object-cover"
                  />
                  {/* Floating SVG Illustration Badge */}
                  <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-white border border-gray-200 p-0.5 shadow-xs flex items-center justify-center">
                    <CatalogSvgIllustration idOrCategory={product.category} size={18} />
                  </div>
                  {product.isBestSeller && (
                    <span className="absolute top-1 right-1 rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-bold text-white shadow-xs">
                      TOP
                    </span>
                  )}
                </div>

                {/* Title & Vendor */}
                <div className="mt-3">
                  <h3 className="text-sm font-bold text-gray-900 line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                    {product.vendorName}
                  </p>
                </div>

                {/* Price */}
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-base font-extrabold text-gray-950">
                    {formatINR(product.pricePaise as Paise)}
                  </span>
                  {product.originalPricePaise && (
                    <span className="text-xs text-gray-400 line-through">
                      ${(product.originalPricePaise / 100).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Meta & Red Action Button (+) */}
              <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                  <Clock size={11} />
                  <span>{product.deliveryWindow || "20 min"}</span>
                </div>

                {/* Red Circular Add Button (+) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openProductModal(product);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-xs hover:bg-red-600 active:bg-red-700"
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
          7. MORE NEARBY VENDORS (List Row Cards)
         ===================================================================== */}
      <div>
        <div className="mb-3.5 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-gray-950">
            More Society Vendors
          </h2>
          <span className="text-xs font-semibold text-gray-400">Direct Gate Access</span>
        </div>

        <div className="space-y-3">
          {MOCK_VENDORS.slice(1, 4).map((vendor) => (
            <Link
              key={vendor.id}
              href={`/app/vendor/${vendor.id}`}
              className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-3 shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={vendor.image}
                  alt={vendor.name}
                  className="h-14 w-14 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 truncate">
                    {vendor.name}
                  </h3>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {vendor.address.split(",")[0]}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-400 font-medium">
                    <span className="flex items-center gap-0.5 font-bold text-gray-800">
                      <Star size={11} className="fill-amber-400 text-amber-400" />
                      {vendor.rating}
                    </span>
                    <span>·</span>
                    <span>{vendor.deliveryWindow}</span>
                  </div>
                </div>
              </div>

              <div className="h-8 w-8 shrink-0 rounded-full bg-gray-50 border border-gray-200 text-gray-600 flex items-center justify-center">
                <ArrowRight size={14} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* =====================================================================
          8. ACTIVE HOUSEHOLD ROUTINES
         ===================================================================== */}
      {routines.length > 0 && (
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-500">
                <ShieldCheck size={16} />
              </div>
              <h2 className="text-sm font-bold text-gray-900">
                Your Active Household Routines ({routines.length})
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              Autopilot Active
            </span>
          </div>

          <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
            {routines.map((routine) => (
              <div
                key={routine.id}
                className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/60 p-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={routine.image}
                    alt={routine.productName}
                    className="h-10 w-10 rounded-xl object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {routine.productName}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate">
                      {routine.nextDelivery}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleRoutinePause(routine.id)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                    routine.status === "ACTIVE"
                      ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                      : "bg-red-500 text-white hover:bg-red-600"
                  }`}
                >
                  {routine.status === "ACTIVE" ? "Pause" : "Resume"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
