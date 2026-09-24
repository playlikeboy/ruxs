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
  Flame,
  Check,
  Truck,
  MapPin,
  ChevronRight,
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
    <div className="min-h-screen bg-[#0b0f0d] text-foreground pb-24">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#0b0f0d]/90 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/app"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.04] text-foreground hover:bg-white/[0.08] transition-colors"
            aria-label="Back to App"
          >
            <ArrowLeft size={18} />
          </Link>

          {/* Breadcrumbs */}
          <nav className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/app" className="hover:text-foreground transition-colors">
              App
            </Link>
            <ChevronRight size={12} />
            <span className="capitalize">{product.category.toLowerCase().replace("_", " ")}</span>
            <ChevronRight size={12} />
            <span className="font-semibold text-foreground truncate max-w-[180px]">
              {product.name}
            </span>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsFavorite(!isFavorite)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.04] text-foreground hover:bg-white/[0.08] transition-colors"
            aria-label="Favorite"
          >
            <Heart
              size={18}
              className={isFavorite ? "fill-red-500 text-red-500" : "text-foreground"}
            />
          </button>
          <button
            type="button"
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.share) {
                navigator.share({
                  title: `${product.name} · RUXS`,
                  text: product.description,
                  url: window.location.href,
                }).catch(() => {});
              }
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.04] text-foreground hover:bg-white/[0.08] transition-colors"
            aria-label="Share"
          >
            <Share2 size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
          {/* Left Column: Visual Showcase & Tabs */}
          <div className="space-y-6">
            {/* Hero Image Card */}
            <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#121a15] to-[#0d120f] p-6 sm:p-10 flex flex-col items-center justify-center text-center">
              {/* Geofence Delivery Guarantee Pill */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <span>Delivery coverage · checked at checkout</span>
              </div>

              {product.isBestSeller && (
                <div className="absolute top-4 right-4 z-10 rounded-full bg-red-500 px-3 py-1 text-[11px] font-bold text-white shadow-xs">
                  BEST SELLER
                </div>
              )}

              {/* Large Circular Food / Item Photo with Realistic Drop Shadow */}
              <div className="relative my-6 h-60 w-60 sm:h-72 sm:w-72 flex items-center justify-center">
                <div className="absolute inset-x-8 bottom-0 h-10 rounded-full bg-black/80 blur-2xl" />
                <img
                  src={product.image}
                  alt={product.name}
                  className="relative z-10 h-full w-full rounded-full object-cover shadow-[0_20px_50px_rgba(0,0,0,0.8)] ring-1 ring-white/10"
                />
                {/* Floating SVG Artwork Badge */}
                <div className="absolute -bottom-2 -right-2 z-20 h-16 w-16 rounded-3xl bg-[#121714] border-2 border-emerald-500/40 p-2.5 shadow-2xl flex items-center justify-center">
                  <CatalogSvgIllustration idOrCategory={product.category} size={44} />
                </div>
              </div>

              {/* Quick Meta Pills */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {product.calories !== undefined && (
                  <div className="flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-300">
                    <Flame size={14} className="fill-orange-400" />
                    <span>{product.calories} Calories</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1 text-xs text-muted-foreground">
                  <Clock size={14} className="text-emerald-400" />
                  <span>{product.deliveryWindow || "Scheduled"}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1 text-xs text-muted-foreground">
                  <Truck size={14} className="text-emerald-400" />
                  <span>Doorstep Drop</span>
                </div>
              </div>
            </div>

            {/* Information Tabs */}
            <div className="rounded-3xl border border-white/[0.08] bg-[#121714] p-5 sm:p-6">
              <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
                {[
                  { id: "overview", label: "Overview" },
                  { id: "guarantee", label: "Delivery Guarantee" },
                  { id: "vendor", label: "Merchant Info" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                      activeTab === tab.id
                        ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="pt-4 text-xs leading-relaxed text-muted-foreground">
                {activeTab === "overview" && (
                  <div className="space-y-3">
                    <p className="text-sm text-foreground leading-relaxed">
                      {product.description}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <span className="text-[10px] uppercase text-subtle font-bold">Standard Unit</span>
                        <p className="mt-1 text-xs font-bold text-foreground capitalize">
                          1 {product.unit}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <span className="text-[10px] uppercase text-subtle font-bold">Preparation</span>
                        <p className="mt-1 text-xs font-bold text-foreground">
                          {product.prepTimeMinutes ? `${product.prepTimeMinutes} mins` : "Same-day fresh"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <span className="text-[10px] uppercase text-subtle font-bold">Packaging</span>
                        <p className="mt-1 text-xs font-bold text-foreground">
                          Sealed & Sanitized
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "guarantee" && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-foreground">
                      <ShieldCheck size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-sm">Geofence Autopilot Guarantee</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Delivery coverage is based on the household location and the merchant's active service area. Final eligibility and delivery charges are checked when the service is scheduled.
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-1.5 text-xs text-muted-foreground pl-2">
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-400" />
                        <span>Delivery fee is determined by the checkout workflow</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-400" />
                        <span>Service cutoff is shown from the selected merchant</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-400" />
                        <span>1-tap instant pause / skip anytime</span>
                      </li>
                    </ul>
                  </div>
                )}

                {activeTab === "vendor" && (
                  <div className="space-y-3">
                    {vendor ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-foreground">{vendor.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{vendor.address}</p>
                          </div>
                          <Link
                            href={`/app/vendor/${vendor.id}`}
                            className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition"
                          >
                            View Store
                          </Link>
                        </div>
                        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">FSSAI Registration</span>
                          <span className="font-mono font-bold text-foreground">{vendor.fssaiNumber}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {vendor.description}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Verified local society vendor partner.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Title, Configuration & Order Action */}
          <div className="space-y-6">
            {/* Title & Rating Header */}
            <div className="rounded-3xl border border-white/[0.08] bg-[#121714] p-5 sm:p-6 space-y-4">
              <div>
                {vendor && (
                  <Link
                    href={`/app/vendor/${vendor.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:underline mb-2"
                  >
                    <Store size={14} />
                    <span>{vendor.name}</span>
                    <ChevronRight size={12} />
                  </Link>
                )}
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {product.name}
                </h1>
              </div>

              {/* Price & Rating Bar */}
              <div className="flex items-center justify-between border-y border-white/[0.06] py-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">
                    {formatINR(unitPrice as Paise)}
                  </span>
                  {product.originalPricePaise && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatINR(product.originalPricePaise as Paise)}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground font-medium">/ {product.unit}</span>
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
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Select Size / Package
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {product.sizes.map((size) => {
                      const isSelected = selectedSize?.id === size.id;
                      const sizePrice = (basePrice + size.priceDeltaPaise) / 100;
                      return (
                        <button
                          key={size.id}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`flex flex-col items-center justify-center rounded-2xl p-3 border transition-all text-center ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_16px_rgba(16,185,129,0.18)]"
                              : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14]"
                          }`}
                        >
                          <span className="text-xs font-bold text-foreground">
                            {size.name}
                          </span>
                          <span
                            className={`text-xs mt-0.5 font-semibold ${
                              isSelected ? "text-emerald-400" : "text-muted-foreground"
                            }`}
                          >
                            ₹{sizePrice.toFixed(2)}
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
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
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
                          className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left transition-all ${
                            isChecked
                              ? "border-emerald-500/40 bg-emerald-500/[0.08]"
                              : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14]"
                          }`}
                        >
                          <div>
                            <p className="text-xs font-bold text-foreground">{addon.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {addon.subtitle ? `${addon.subtitle} · ` : ""}
                              +{formatINR(addon.pricePaise as Paise)}
                            </p>
                          </div>

                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-lg border transition ${
                              isChecked
                                ? "border-emerald-500 bg-emerald-500 text-black"
                                : "border-white/[0.2] bg-transparent"
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
              <div className="pt-4 border-t border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Quantity
                  </span>
                  <DSQuantityStepper
                    value={quantity}
                    onChange={setQuantity}
                    min={1}
                    size="md"
                    variant="pill"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span>Subtotal ({quantity} item{quantity > 1 ? "s" : ""}):</span>
                  <span className="text-base font-extrabold text-white">
                    {formatINR(totalPrice as Paise)}
                  </span>
                </div>

                <DSButton
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleAddToCart}
                  className="mt-2 text-sm font-bold shadow-lg shadow-emerald-500/25"
                >
                  Add to Cart · {formatINR(totalPrice as Paise)}
                </DSButton>

                <p className="text-center text-[10px] text-muted-foreground">
                  Free doorstep delivery · Cancel or pause anytime in 1 tap
                </p>
              </div>
            </div>

            {/* Vendor Mini-Card */}
            {vendor && (
              <div className="rounded-3xl border border-white/[0.08] bg-[#121714] p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={vendor.image}
                    alt={vendor.name}
                    className="h-12 w-12 rounded-2xl object-cover border border-white/[0.1]"
                  />
                  <div>
                    <h3 className="text-xs font-bold text-white">{vendor.name}</h3>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin size={11} className="text-emerald-400" />
                      {vendor.address.split(",")[0]} · ★ {vendor.rating}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/app/vendor/${vendor.id}`}
                  className="rounded-full border border-white/[0.12] bg-white/[0.04] px-3.5 py-1.5 text-xs font-bold text-foreground hover:bg-white/[0.08] transition"
                >
                  Visit
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Related Products from Category */}
        {relatedProducts.length > 0 && (
          <div className="mt-12 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-white">
                  More Items You May Need
                </h2>
                <p className="text-xs text-muted-foreground">
                  Frequently ordered together in {currentGeofence.societyName.split(",")[0]}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
              {relatedProducts.map((item) => (
                <Link
                  key={item.id}
                  href={`/app/product/${item.id}`}
                  className="group flex flex-col justify-between rounded-3xl border border-white/[0.08] bg-[#121714] p-3.5"
                >
                  <div>
                    <div className="relative mx-auto h-24 w-24 sm:h-28 sm:w-28 my-1 flex items-center justify-center">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full rounded-full object-cover"
                      />
                    </div>
                    <h3 className="mt-2 text-xs font-bold text-white line-clamp-1 group-hover:text-red-400 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                      {item.vendorName}
                    </p>
                    <p className="mt-1 text-sm font-extrabold text-white">
                      {formatINR(item.pricePaise as Paise)}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>★ {item.rating}</span>
                    <span className="font-bold text-emerald-400">View</span>
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
