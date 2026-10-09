"use client";

import { formatINR, Paise } from "@/src/shared/types/money";
import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Clock,
  ShieldCheck,
  Building,
  Plus,
  Check,
  ChevronRight,
  Award,
} from "lucide-react";
import {
  CatalogVendor,
  CatalogProduct,
  useCustomerUI,
} from "@/src/modules/customer-ui";
import {
  DSRatingPill,
} from "@/src/design-system";

interface VendorDetailClientProps {
  vendor: CatalogVendor;
  products: CatalogProduct[];
}

export default function VendorDetailClient({
  vendor,
  products,
}: VendorDetailClientProps) {
  const { addToCart, setIsCartOpen } = useCustomerUI();
  const [isFavorite, setIsFavorite] = useState(false);
  const [searchFilter] = useState("");

  const filteredProducts = products.filter(
    (p) =>
      !searchFilter ||
      p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.description.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-surface text-ink pb-32 font-sans selection:bg-coral/20">
      {/* Top Floating Nav Bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface-raised/95 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/app"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-raised text-ink hover:bg-surface-band transition-colors shadow-xs cursor-pointer"
            aria-label="Back to App"
          >
            <ArrowLeft size={18} />
          </Link>

          {/* Breadcrumbs */}
          <nav className="hidden sm:flex items-center gap-1.5 text-xs text-ink-muted">
            <Link href="/app" className="hover:text-ink transition-colors font-semibold">
              App
            </Link>
            <ChevronRight size={12} />
            <span>Merchants</span>
            <ChevronRight size={12} />
            <span className="font-bold text-ink truncate max-w-[180px]">
              {vendor.name}
            </span>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsFavorite(!isFavorite)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-raised text-ink hover:bg-surface-band transition-colors shadow-xs cursor-pointer"
            aria-label="Favorite"
          >
            <Heart
              size={18}
              className={isFavorite ? "fill-[#F2A4A4] text-action" : "text-ink"}
            />
          </button>
          <button
            type="button"
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.share) {
                navigator.share({
                  title: `${vendor.name} · Verified Society Merchant on RUXS`,
                  text: vendor.description,
                  url: window.location.href,
                }).catch(() => {});
              }
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-raised text-ink hover:bg-surface-band transition-colors shadow-xs cursor-pointer"
            aria-label="Share"
          >
            <Share2 size={18} />
          </button>
        </div>
      </header>

      {/* Main Vendor Content */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Merchant Hero Banner Card */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-surface-raised shadow-card">
          {/* Banner Photo */}
          <div className="relative h-48 sm:h-64 w-full bg-surface-band">
            <img
              src={vendor.bannerImage}
              alt={vendor.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-raised via-transparent to-black/30" />

            {vendor.badge && (
              <div className="absolute top-4 right-4 rounded-full bg-coral px-3 py-1 text-xs font-bold text-white shadow-sm">
                ★ {vendor.badge}
              </div>
            )}
          </div>

          {/* Profile Details Header */}
          <div className="relative px-6 pb-6 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
              <div className="flex items-end gap-4">
                <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-3xl overflow-hidden border-4 border-surface-raised bg-surface-band shadow-soft shrink-0">
                  <img
                    src={vendor.image}
                    alt={vendor.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-black text-ink font-display">
                      {vendor.name}
                    </h1>
                    {vendor.isVerified && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E8F5E9] text-[#2E7D32]">
                        <Check size={12} className="stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-muted flex items-center gap-1.5 font-medium">
                    <MapPin size={13} className="text-coral" />
                    <span>{vendor.address}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <DSRatingPill
                  rating={vendor.rating}
                  reviewCount={vendor.reviewCount}
                  size="md"
                />
              </div>
            </div>

            {/* Merchant Bio / Description */}
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              {vendor.description}
            </p>

            {/* Quick Metrics Bar */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-border">
              <div className="rounded-2xl border border-border bg-surface-band p-3">
                <span className="text-[10px] uppercase font-bold text-ink-muted">Primary Shift</span>
                <p className="mt-1 text-xs font-bold text-ink flex items-center gap-1">
                  <Clock size={12} className="text-coral" />
                  <span>{vendor.deliveryWindow}</span>
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-surface-band p-3">
                <span className="text-[10px] uppercase font-bold text-ink-muted">Doorstep Fee</span>
                <p className="mt-1 text-xs font-bold text-[#2E7D32]">
                  ₹0 (Society Pass)
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-surface-band p-3">
                <span className="text-[10px] uppercase font-bold text-ink-muted">Opening Hours</span>
                <p className="mt-1 text-xs font-bold text-ink">
                  {vendor.openingHours}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-surface-band p-3">
                <span className="text-[10px] uppercase font-bold text-ink-muted">FSSAI Status</span>
                <p className="mt-1 text-xs font-bold text-ink flex items-center gap-1">
                  <ShieldCheck size={12} className="text-[#2E7D32]" />
                  <span>Verified Partner</span>
                </p>
              </div>
            </div>

            {/* Societies Covered Pills */}
            <div className="mt-4 pt-3 border-t border-border">
              <span className="text-[10px] uppercase font-bold text-ink-muted block mb-2">
                Connected Gated Communities ({vendor.societiesCovered.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {vendor.societiesCovered.map((soc) => (
                  <span
                    key={soc}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-band px-3 py-1 text-xs font-bold text-ink"
                  >
                    <Building size={11} className="text-coral" />
                    <span>{soc}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Product Catalog Menu Header */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight font-display">
                Menu & Daily Subscriptions ({products.length})
              </h2>
              <p className="text-xs text-ink-muted">
                Set up a 1-tap recurring schedule or order once for doorstep delivery.
              </p>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="group flex flex-col justify-between rounded-3xl border border-border bg-surface-raised p-4 shadow-card hover:shadow-soft transition-all"
              >
                <div>
                  <Link href={`/app/product/${p.id}`} className="block">
                    <div className="relative mx-auto my-2 h-36 w-36 flex items-center justify-center rounded-2xl bg-surface-band border border-border overflow-hidden">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      {p.isBestSeller && (
                        <span className="absolute top-2 right-2 rounded-full bg-coral px-2 py-0.5 text-[9px] font-bold text-white shadow-xs">
                          TOP
                        </span>
                      )}
                    </div>

                    <h3 className="mt-3 text-sm font-bold text-ink line-clamp-1 group-hover:text-action transition-colors font-display">
                      {p.name}
                    </h3>
                    <p className="text-xs text-ink-muted line-clamp-2 mt-1 leading-relaxed">
                      {p.description}
                    </p>
                  </Link>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                  <div>
                    <span className="text-base font-extrabold text-ink">
                      {formatINR(p.pricePaise as Paise)}
                    </span>
                    <span className="text-xs text-ink-muted"> / {p.unit}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/app/product/${p.id}`}
                      className="rounded-full border border-border bg-surface-band px-3 py-1.5 text-xs font-bold text-ink hover:bg-surface-subtle transition-colors"
                    >
                      Details
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        addToCart(p, 1);
                        setIsCartOpen(true);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-action text-white font-bold shadow-xs hover:bg-action-hover transition-colors cursor-pointer"
                      aria-label={`Add ${p.name} to cart`}
                    >
                      <Plus size={16} className="stroke-[3]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quality & Trust Assurance Footer Card */}
        <div className="rounded-3xl border border-border bg-surface-raised p-6 space-y-4 shadow-card">
          <div className="flex items-center gap-2 text-action">
            <Award size={18} />
            <h3 className="text-sm font-bold uppercase tracking-wider text-ink font-display">
              Merchant Quality Pledge & Safety Standards
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 text-xs">
            <div className="rounded-2xl border border-border bg-surface-band p-4 space-y-1.5">
              <span className="font-bold text-ink flex items-center gap-1.5">
                <Check size={14} className="text-[#2E7D32]" />
                <span>Zero Container Waste</span>
              </span>
              <p className="text-ink-muted leading-relaxed">
                Automated empty bottle & can return system recorded at your door. Zero deposit forfeit.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface-band p-4 space-y-1.5">
              <span className="font-bold text-ink flex items-center gap-1.5">
                <Check size={14} className="text-[#2E7D32]" />
                <span>Govt FSSAI Certified</span>
              </span>
              <p className="text-ink-muted leading-relaxed font-mono">
                Reg: {vendor.fssaiNumber} · Audited monthly for food handling and thermal chain integrity.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface-band p-4 space-y-1.5">
              <span className="font-bold text-ink flex items-center gap-1.5">
                <Check size={14} className="text-[#2E7D32]" />
                <span>Autopilot Schedule</span>
              </span>
              <p className="text-ink-muted leading-relaxed">
                Seamless daily coordination with automated pause and vacation hold features.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
