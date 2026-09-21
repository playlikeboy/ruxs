"use client";

import React, { useMemo, useState } from "react";
import { formatINR, Paise } from "@/src/shared/types/money";
import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  Search,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  MapPin,
  Sparkles,
  Flame,
  Clock,
  Plus,
  ArrowRight,
  TrendingUp,
  Store,
} from "lucide-react";
import { useCustomerUI } from "../context/CustomerUIContext";
import { MOCK_PRODUCTS, MOCK_CATEGORIES, MOCK_VENDORS } from "../mock-data";
import { CatalogSvgIllustration } from "../svg-assets";
import {
  DSButton,
  DSBadge,
  DSCard,
  DSCategoryPill,
  DSSearchBar,
  DSRatingPill,
} from "@/src/design-system";

export function DiscoveryView() {
  const {
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    openProductModal,
    addToCart,
    unreadNotifCount,
    setIsNotificationsOpen,
    currentGeofence,
    setIsGeofenceModalOpen,
    routines,
    toggleRoutinePause,
  } = useCustomerUI();

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter((p) => {
      const matchesCategory =
        activeCategory === "ALL" || p.category === activeCategory;
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="space-y-6 pb-24">
      {/* 1. TOP HEADER: Greeting, Geofence Radar Pill, Notification Bell */}
      <header className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-2 border-emerald-500/40 p-0.5 shadow-[0_0_16px_rgba(16,185,129,0.2)]">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
                alt="User Profile"
                className="h-full w-full rounded-full object-cover"
              />
            </div>
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#0b0d0c] bg-emerald-500" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Hello</span>
              <span className="text-sm">👋</span>
            </div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              Delisas Agency
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Geofence Status Pill */}
          <button
            type="button"
            onClick={() => setIsGeofenceModalOpen(true)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all select-none active:scale-95 ${
              currentGeofence.isInside
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                : "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                currentGeofence.isInside ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            <span className="max-w-[110px] sm:max-w-[160px] truncate">
              {currentGeofence.societyName.split(",")[0]}
            </span>
          </button>

          {/* Notifications Button */}
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(true)}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-foreground hover:bg-white/[0.08] transition active:scale-90"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadNotifCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0b0d0c]" />
            )}
          </button>
        </div>
      </header>

      {/* 2. SEARCH BAR with Filter Button */}
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
          onFilterClick={() => setIsGeofenceModalOpen(true)}
        />
      </form>

      {/* 3. CATEGORIES SECTION (Horizontal Scrollable rounded squircle cards) */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-tight text-foreground uppercase text-subtle">
            Categories
          </h2>
          <span className="text-xs text-muted-foreground">
            {MOCK_CATEGORIES.length - 1} verticals
          </span>
        </div>
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {MOCK_CATEGORIES.map((cat) => (
            <DSCategoryPill
              key={cat.id}
              id={cat.id}
              label={cat.label}
              icon={cat.emoji}
              isActive={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
              count={cat.count}
            />
          ))}
        </div>
      </div>

      {/* 4. HERO PROMOTIONAL AD FLYER SLIDER (From Image 1 Screen 1) */}
      <DSCard
        variant="hero"
        className="relative p-5 sm:p-6 overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-[#0e2417] via-[#101e16] to-[#0d1512]"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="max-w-[65%] sm:max-w-md z-10">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
              <Sparkles size={11} /> New Year Offer
            </div>
            <h3 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-white">
              30% OFF
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              16 - 31 Dec · Valid on all daily subscriptions
            </p>
            <div className="mt-4">
              <DSButton
                size="sm"
                variant="primary"
                onClick={() => setActiveCategory("ALL")}
              >
                Get Now
              </DSButton>
            </div>
          </div>

          <div className="relative shrink-0 pr-2">
            <div className="relative h-28 w-28 sm:h-36 sm:w-36 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />
              <img
                src="https://images.unsplash.com/photo-1526367790999-0150786686a2?w=300&auto=format&fit=crop&q=80"
                alt="Delivery Courier & Pizza"
                className="relative z-10 h-24 w-24 sm:h-32 sm:w-32 object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]"
              />
            </div>
          </div>
        </div>
      </DSCard>

      {/* 5. BEST SELLERS SECTION (2-Column Grid as in Image 1 Screen 1) */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Best Sellers
            </h2>
            <p className="text-xs text-muted-foreground">
              Top-rated items in {currentGeofence.societyName.split(",")[0]}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveCategory("ALL")}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            See All
          </button>
        </div>

        {/* 2-Column Responsive Card Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <Link
              key={product.id}
              href={`/app/product/${product.id}`}
              className="group relative flex flex-col justify-between rounded-3xl border border-white/[0.08] bg-[#121714] p-3.5 sm:p-4 shadow-[0_8px_20px_rgba(0,0,0,0.3)] transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-[0_12px_32px_rgba(16,185,129,0.15)] cursor-pointer select-none"
            >
              <div>
                {/* Floating Circular Image with Drop Shadow */}
                <div className="relative mx-auto flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center my-1">
                  <div className="absolute inset-0 rounded-full bg-black/40 blur-md translate-y-3" />
                  <img
                    src={product.image}
                    alt={product.name}
                    className="relative z-10 h-full w-full rounded-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Floating SVG Vector Badge */}
                  <div className="absolute -bottom-1 -right-1 z-20 h-8 w-8 rounded-full bg-[#121714] border border-white/20 p-1 shadow-lg flex items-center justify-center">
                    <CatalogSvgIllustration idOrCategory={product.category} size={22} />
                  </div>
                  {product.isBestSeller && (
                    <span className="absolute top-0 right-0 z-20 rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold text-black shadow">
                      ★ TOP
                    </span>
                  )}
                </div>

                {/* Product Title & Vendor */}
                <div className="mt-3">
                  <h3 className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-emerald-400 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                    {product.vendorName}
                  </p>
                </div>

                {/* Price Display */}
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-base font-extrabold text-foreground">
                    ${(product.pricePaise / 100).toFixed(2)}
                  </span>
                  {product.originalPricePaise && (
                    <span className="text-xs text-muted-foreground line-through">
                      ${(product.originalPricePaise / 100).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Meta & Action Row */}
              <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between">
                <div className="space-y-1">
                  {product.calories !== undefined && (
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-orange-400">
                      <Flame size={11} className="fill-orange-400" />
                      <span>{product.calories} Calories</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock size={11} />
                    <span>{product.deliveryWindow || "20 min"}</span>
                  </div>
                </div>

                {/* Green Add Button (+) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openProductModal(product);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-black shadow-[0_2px_10px_rgba(16,185,129,0.35)] transition-all hover:bg-emerald-400 hover:scale-110 active:scale-95"
                  aria-label={`Add ${product.name}`}
                >
                  <Plus size={16} className="stroke-[3]" />
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 6. NEARBY VERIFIED MERCHANTS (From Image 2 Screen 1) */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Nearby Society Restaurants & Vendors
            </h2>
            <p className="text-xs text-muted-foreground">
              Direct geofenced gate-pass access
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-400">View all</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {MOCK_VENDORS.slice(0, 4).map((vendor) => (
            <Link
              key={vendor.id}
              href={`/app/vendor/${vendor.id}`}
              className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#121714] transition hover:-translate-y-1 hover:border-emerald-500/40 shadow-xl"
            >
              <div className="relative h-44 w-full">
                <img
                  src={vendor.bannerImage || vendor.image}
                  alt={vendor.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute top-3 right-3">
                  <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-black shadow">
                    {vendor.deliveryWindow}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {vendor.name}
                    </h3>
                    <p className="text-xs text-white/80 flex items-center gap-1 mt-0.5">
                      <MapPin size={12} className="text-emerald-400" />
                      {vendor.address.split(",")[0]} · ★ {vendor.rating} ({vendor.reviewCount} reviews)
                    </p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-emerald-500 group-hover:text-black transition">
                    <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 7. ACTIVE ROUTINES TEASER DECK */}
      {routines.length > 0 && (
        <div className="mt-8 rounded-3xl border border-white/[0.08] bg-[#111613] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <ShieldCheck size={16} />
              </div>
              <h2 className="text-sm font-bold text-foreground">
                Your Active Household Routines ({routines.length})
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-emerald-400">
              Autopilot Active
            </span>
          </div>

          <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
            {routines.map((routine) => (
              <div
                key={routine.id}
                className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={routine.image}
                    alt={routine.productName}
                    className="h-10 w-10 rounded-xl object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      {routine.productName}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {routine.nextDelivery}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleRoutinePause(routine.id)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                    routine.status === "ACTIVE"
                      ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                      : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
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
