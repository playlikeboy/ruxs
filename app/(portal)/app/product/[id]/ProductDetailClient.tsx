"use client";

import { formatINR, Paise } from "@/src/shared/types/money";
import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  Share2,
  Store,
  ShieldCheck,
  Clock,
  Check,
  Truck,
  MapPin,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  CatalogProduct,
  CatalogVendor,
  ProductOption,
  ProductAddOn,
  useCustomerUI,
  CatalogSvgIllustration,
} from "@/src/modules/customer-ui";
import {
  DSButton,
  DSQuantityStepper,
  DSRatingPill,
} from "@/src/design-system";

interface ProductDetailClientProps {
  product: CatalogProduct;
  vendor?: CatalogVendor;
  relatedProducts: CatalogProduct[];
}

export default function ProductDetailClient({
  product,
  vendor,
  relatedProducts,
}: ProductDetailClientProps) {
  const { addToCart, setIsCartOpen, currentGeofence } = useCustomerUI();

  const [selectedSize, setSelectedSize] = useState<ProductOption | undefined>(
    product.sizes?.find((s) => s.isDefault) || product.sizes?.[0]
  );
  const [selectedAddOns, setSelectedAddOns] = useState<ProductAddOn[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "guarantee" | "vendor">("overview");

  const toggleAddOn = (addon: ProductAddOn) => {
    if (selectedAddOns.some((a) => a.id === addon.id)) {
      setSelectedAddOns(selectedAddOns.filter((a) => a.id !== addon.id));
    } else {
      setSelectedAddOns([...selectedAddOns, addon]);
    }
  };

  const basePrice = product.pricePaise;
  const sizeDelta = selectedSize?.priceDeltaPaise || 0;
  const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + a.pricePaise, 0);
  const unitPrice = basePrice + sizeDelta + addOnsTotal;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedSize, selectedAddOns);
    setIsCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-surface pb-32 text-ink font-sans selection:bg-coral/20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface-raised/95 px-4 sm:px-6 lg:px-8 py-3.5 backdrop-blur-xl shadow-xs">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link
            href="/app"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-raised text-ink hover:bg-surface-band transition-colors shadow-xs cursor-pointer"
            aria-label="Back to App"
          >
            <ArrowLeft size={18} />
          </Link>

          <span className="text-xs font-bold text-coral uppercase tracking-wider">
            {product.category.replaceAll("_", " ")}
          </span>

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
                if (navigator.share) {
                  navigator
                    .share({
                      title: product.name,
                      text: product.description,
                      url: window.location.href,
                    })
                    .catch(() => {});
                }
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-raised text-ink hover:bg-surface-band transition-colors shadow-xs cursor-pointer"
              aria-label="Share"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
          {/* Left Column: Visual Showcase & Tabs */}
          <div className="space-y-6">
            {/* Hero Image Card */}
            <div className="relative overflow-hidden rounded-3xl border border-border bg-surface-raised p-6 sm:p-10 flex flex-col items-center justify-center text-center shadow-card">
              {/* Delivery Guarantee Pill */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-full border border-coral/30 bg-coral/10 px-3 py-1 text-xs font-bold text-action">
                <span className="h-2 w-2 rounded-full bg-coral" />
                <span>Pre-cleared Gate Delivery</span>
              </div>

              {product.isBestSeller && (
                <div className="absolute top-4 right-4 z-10 rounded-full bg-coral px-3 py-1 text-[11px] font-bold text-white shadow-xs">
                  TOP ESSENTIAL
                </div>
              )}

              {/* Product Image */}
              <div className="relative my-6 h-60 w-60 sm:h-72 sm:w-72 flex items-center justify-center">
                <img
                  src={product.image}
                  alt={product.name}
                  className="relative z-10 h-full w-full rounded-3xl object-cover shadow-soft border border-border"
                />
                <div className="absolute -bottom-2 -right-2 z-20 h-16 w-16 rounded-2xl bg-surface-raised border border-border p-2.5 shadow-card flex items-center justify-center">
                  <CatalogSvgIllustration idOrCategory={product.category} size={40} />
                </div>
              </div>

              {/* Quick Meta Pills */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface-band px-3 py-1 text-xs text-ink-muted font-medium">
                  <Clock size={14} className="text-coral" />
                  <span>{product.deliveryWindow || "Morning 6–8 AM"}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface-band px-3 py-1 text-xs text-ink-muted font-medium">
                  <Truck size={14} className="text-coral" />
                  <span>Direct doorstep delivery</span>
                </div>
              </div>
            </div>

            {/* Information Tabs */}
            <div className="rounded-3xl border border-border bg-surface-raised p-5 sm:p-6 shadow-card">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                {[
                  { id: "overview", label: "Overview" },
                  { id: "guarantee", label: "Delivery Guarantee" },
                  { id: "vendor", label: "Merchant Info" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`rounded-full px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
                      activeTab === tab.id
                        ? "bg-action text-white shadow-xs"
                        : "text-ink-muted hover:text-ink hover:bg-surface-band"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="pt-4 text-xs leading-relaxed text-ink-muted">
                {activeTab === "overview" && (
                  <div className="space-y-3">
                    <p className="text-sm text-ink leading-relaxed font-medium">
                      {product.description}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                      <div className="rounded-2xl border border-border bg-surface-band p-3">
                        <span className="text-[10px] uppercase text-ink-muted font-bold">Standard Unit</span>
                        <p className="mt-1 text-xs font-bold text-ink capitalize">
                          1 {product.unit}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border bg-surface-band p-3">
                        <span className="text-[10px] uppercase text-ink-muted font-bold">Verification</span>
                        <p className="mt-1 text-xs font-bold text-[#2E7D32]">
                          Passed Quality Check
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border bg-surface-band p-3">
                        <span className="text-[10px] uppercase text-ink-muted font-bold">Cadence</span>
                        <p className="mt-1 text-xs font-bold text-ink">
                          Daily / Alternate
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "guarantee" && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <ShieldCheck size={20} className="text-[#2E7D32] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-ink font-display">Society Autopilot SLA</h4>
                        <p className="mt-1 text-xs text-ink-muted leading-relaxed">
                          Deliveries are coordinated with your society security guards before 7:00 AM. In case of delay, 1-tap credits are instantly posted to your digital Khata.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "vendor" && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-ink font-display">{product.vendorName}</h4>
                    <p className="text-xs text-ink-muted">
                      Local verified service partner servicing {currentGeofence.societyName.split(",")[0]}.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Pricing & Options Card */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-border bg-surface-raised p-6 shadow-card space-y-6">
              <div>
                {vendor && (
                  <Link
                    href={`/app/vendor/${vendor.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-action hover:underline mb-2"
                  >
                    <Store size={14} className="text-coral" />
                    <span>{vendor.name}</span>
                    <ChevronRight size={12} />
                  </Link>
                )}
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-ink font-display">
                  {product.name}
                </h1>
              </div>

              {/* Price & Rating Bar */}
              <div className="flex items-center justify-between border-y border-border py-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-ink font-display">
                    {formatINR(unitPrice as Paise)}
                  </span>
                  {product.originalPricePaise && (
                    <span className="text-sm text-ink-subtle line-through">
                      {formatINR(product.originalPricePaise as Paise)}
                    </span>
                  )}
                  <span className="text-xs text-ink-muted font-medium">/ {product.unit}</span>
                </div>

                <DSRatingPill
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                  size="md"
                />
              </div>

              {/* Size Selector */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Select Package / Size
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {product.sizes.map((size) => {
                      const isSelected = selectedSize?.id === size.id;
                      const sizePricePaise = basePrice + size.priceDeltaPaise;
                      return (
                        <button
                          key={size.id}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`flex flex-col items-center justify-center rounded-2xl p-3 border transition-all text-center cursor-pointer ${
                            isSelected
                              ? "border-action bg-coral/10 shadow-xs"
                              : "border-border bg-surface-band hover:border-border-strong hover:bg-surface-subtle"
                          }`}
                        >
                          <span className="text-xs font-bold text-ink">
                            {size.name}
                          </span>
                          <span
                            className={`text-xs mt-0.5 font-bold ${
                              isSelected ? "text-action" : "text-ink-muted"
                            }`}
                          >
                            {formatINR(sizePricePaise as Paise)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add-ons Checklist */}
              {product.addOns && product.addOns.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Optional Add-ons & Extras
                  </label>
                  <div className="space-y-2">
                    {product.addOns.map((addon) => {
                      const isChecked = selectedAddOns.some((a) => a.id === addon.id);
                      return (
                        <button
                          key={addon.id}
                          type="button"
                          onClick={() => toggleAddOn(addon)}
                          className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left transition-all cursor-pointer ${
                            isChecked
                              ? "border-action bg-coral/10"
                              : "border-border bg-surface-band hover:border-border-strong hover:bg-surface-subtle"
                          }`}
                        >
                          <div>
                            <p className="text-xs font-bold text-ink">{addon.name}</p>
                            <p className="text-[11px] text-ink-muted">
                              {addon.subtitle ? `${addon.subtitle} · ` : ""}
                              +{formatINR(addon.pricePaise as Paise)}
                            </p>
                          </div>

                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-lg border transition ${
                              isChecked
                                ? "border-action bg-action text-white"
                                : "border-border bg-transparent"
                            }`}
                          >
                            {isChecked && <Check size={12} className="stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Order Controls & Action Bar */}
              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                    Quantity
                  </span>
                  <DSQuantityStepper
                    value={quantity}
                    onChange={setQuantity}
                    min={1}
                    size="md"
                    variant="coral-pill"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-ink-muted pt-1">
                  <span>Subtotal ({quantity} item{quantity > 1 ? "s" : ""}):</span>
                  <span className="text-base font-extrabold text-action">
                    {formatINR(totalPrice as Paise)}
                  </span>
                </div>

                <DSButton
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleAddToCart}
                  className="mt-2 text-sm font-bold"
                >
                  Add to Cart · {formatINR(totalPrice as Paise)}
                </DSButton>

                <p className="text-center text-[10px] text-ink-muted">
                  Free doorstep delivery · Reconciled to digital Khata ledger
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12 space-y-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-ink font-display">
                More Items You May Need
              </h2>
              <p className="text-xs text-ink-muted">
                Frequently paired in {currentGeofence.societyName.split(",")[0]}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
              {relatedProducts.map((item) => (
                <Link
                  key={item.id}
                  href={`/app/product/${item.id}`}
                  className="group flex flex-col justify-between rounded-3xl border border-border bg-surface-raised p-3.5 shadow-card hover:shadow-soft transition-all"
                >
                  <div>
                    <div className="relative mx-auto h-24 w-24 sm:h-28 sm:w-28 my-1 flex items-center justify-center rounded-2xl bg-surface-band border border-border overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <h3 className="mt-2 text-xs font-bold text-ink line-clamp-1 group-hover:text-action transition-colors font-display">
                      {item.name}
                    </h3>
                    <p className="text-[10px] text-ink-muted truncate mt-0.5">
                      {item.vendorName}
                    </p>
                    <p className="mt-1 text-sm font-extrabold text-ink">
                      {formatINR(item.pricePaise as Paise)}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-[10px] text-ink-muted">
                    <span className="font-bold text-[#B45309]">★ {item.rating}</span>
                    <span className="font-bold text-action">View →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
