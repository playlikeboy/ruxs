"use client";

import { formatINR, Paise } from "@/src/shared/types/money";
import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  ArrowLeft,
  X,
  SlidersHorizontal,
  Store,
  MapPin,
  Clock,
  Plus,
  ShieldCheck,
  Building,
  Check,
  Sparkles,
  ArrowRight,
  Star,
} from "lucide-react";
import type { CatalogProduct, CatalogVendor, ServiceCategoryId } from "@/src/modules/customer-ui/types";
import { useCustomerUI } from "@/src/modules/customer-ui/context/CustomerUIContext";
import { CatalogSvgIllustration, CuteHeartSvg } from "@/src/modules/customer-ui/svg-assets";
import { categoryFromParam } from "@/src/modules/customer-ui/routes";
import {
  DSButton,
  DSRatingPill,
  DSCategoryPill,
} from "@/src/design-system";

export default function SearchClient({
  catalog,
}: {
  catalog: { products: CatalogProduct[]; vendors: CatalogVendor[]; categories: { id: ServiceCategoryId; label: string; iconName?: string; count: number }[] };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = categoryFromParam(searchParams.get("category")) as ServiceCategoryId;

  const { addToCart, setIsCartOpen } = useCustomerUI();

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategoryId>(initialCategory);
  const [activeTab, setActiveTab] = useState<"ALL" | "PRODUCTS" | "VENDORS">(
    (searchParams.get("type")?.toUpperCase() as "ALL" | "PRODUCTS" | "VENDORS") || "ALL"
  );
  const [priceFilter, setPriceFilter] = useState<"ALL" | "UNDER_500" | "500_TO_1000" | "OVER_1000">(
    (searchParams.get("price")?.toUpperCase() as "ALL" | "UNDER_500" | "500_TO_1000" | "OVER_1000") || "ALL"
  );

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (selectedCategory !== "ALL") params.set("category", selectedCategory);
    if (activeTab !== "ALL") params.set("type", activeTab.toLowerCase());
    if (priceFilter !== "ALL") params.set("price", priceFilter.toLowerCase());

    const stringified = params.toString();
    const newPath = stringified ? `/app/search?${stringified}` : "/app/search";
    router.replace(newPath, { scroll: false });
  }, [query, selectedCategory, activeTab, priceFilter, router]);

  const filteredProducts = useMemo(() => {
    return catalog.products.filter((p) => {
      const matchesQuery =
        !query ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.vendorName.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase());

      const matchesCat =
        selectedCategory === "ALL" || p.category === selectedCategory;

      let matchesPrice = true;
      if (priceFilter === "UNDER_500") {
        matchesPrice = p.pricePaise < 50000;
      } else if (priceFilter === "500_TO_1000") {
        matchesPrice = p.pricePaise >= 50000 && p.pricePaise <= 100000;
      } else if (priceFilter === "OVER_1000") {
        matchesPrice = p.pricePaise > 100000;
      }

      return matchesQuery && matchesCat && matchesPrice;
    });
  }, [catalog.products, query, selectedCategory, priceFilter]);

  const filteredVendors = useMemo(() => {
    return catalog.vendors.filter((v) => {
      const matchesQuery =
        !query ||
        v.name.toLowerCase().includes(query.toLowerCase()) ||
        v.description.toLowerCase().includes(query.toLowerCase()) ||
        v.address.toLowerCase().includes(query.toLowerCase());

      const matchesCat =
        selectedCategory === "ALL" ||
        v.category === selectedCategory;

      return matchesQuery && matchesCat;
    });
  }, [catalog.vendors, query, selectedCategory]);

  const popularSearches = [
    "A2 Cow Milk",
    "Bisleri 20L Water",
    "South Indian Tiffin",
    "Puja Flowers",
    "Dog Walking",
    "Steam Iron Pass",
    "Paneer Butter Masala",
    "Sourdough Loaf",
  ];

  const totalResults =
    (activeTab === "ALL" ? filteredProducts.length + filteredVendors.length : 0) +
    (activeTab === "PRODUCTS" ? filteredProducts.length : 0) +
    (activeTab === "VENDORS" ? filteredVendors.length : 0);

  const clearAllFilters = () => {
    setQuery("");
    setSelectedCategory("ALL");
    setActiveTab("ALL");
    setPriceFilter("ALL");
  };

  return (
    <div className="min-h-screen bg-surface pb-32 text-ink font-sans selection:bg-coral/20">
      {/* Search Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface-raised/95 px-4 sm:px-6 lg:px-8 py-3.5 backdrop-blur-xl shadow-xs">
        <div className="mx-auto max-w-5xl flex items-center gap-3">
          <Link
            href="/app"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface-raised text-ink hover:bg-surface-band transition-colors shadow-xs cursor-pointer"
            aria-label="Back to App"
          >
            <ArrowLeft size={18} />
          </Link>

          {/* Search Input Box */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-coral pointer-events-none"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search milk, water cans, meals, vendors, societies..."
              autoFocus
              className="h-11 w-full rounded-full border border-border bg-surface pl-10 pr-10 text-sm text-ink placeholder:text-ink-subtle outline-none transition focus:border-action focus:ring-2 focus:ring-coral/20 font-medium"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-surface-band text-ink-muted hover:text-ink transition cursor-pointer"
                aria-label="Clear Search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Search Content */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-5 space-y-6">
        {/* Type Filter Tabs: All, Products, Vendors */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-2">
            {[
              { id: "ALL", label: `All (${filteredProducts.length + filteredVendors.length})` },
              { id: "PRODUCTS", label: `Items (${filteredProducts.length})` },
              { id: "VENDORS", label: `Merchants (${filteredVendors.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition select-none cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-action text-white shadow-xs"
                    : "border border-border bg-surface-raised text-ink-muted hover:text-ink hover:bg-surface-band"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Price Range Dropdown / Filter Pills */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <span className="text-ink-muted font-bold mr-1">Price:</span>
            {[
              { id: "ALL", label: "All" },
              { id: "UNDER_500", label: "< ₹500" },
              { id: "500_TO_1000", label: "₹500 – ₹1,000" },
              { id: "OVER_1000", label: "> ₹1,000" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPriceFilter(p.id as any)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                  priceFilter === p.id
                    ? "border border-action bg-coral/15 text-action"
                    : "border border-border bg-surface-raised text-ink-muted hover:text-ink"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Horizontal Pills */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-bold uppercase tracking-wider text-[10px]">Filter by Category</span>
            {selectedCategory !== "ALL" && (
              <button
                type="button"
                onClick={() => setSelectedCategory("ALL")}
                className="text-action font-bold hover:underline cursor-pointer"
              >
                Reset Category
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            {catalog.categories.map((cat) => (
              <DSCategoryPill
                key={cat.id}
                id={cat.id}
                label={cat.label}
                icon={cat.id}
                isActive={selectedCategory === cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                count={cat.count}
              />
            ))}
          </div>
        </div>

        {/* Popular Searches Chips (if query is empty) */}
        {!query && (
          <div className="rounded-3xl border border-border bg-surface-raised p-5 space-y-3 shadow-card">
            <div className="flex items-center gap-2 text-xs font-bold text-coral uppercase tracking-wider">
              <Sparkles size={14} className="text-coral" />
              <span>Trending Society Searches</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {popularSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQuery(term)}
                  className="rounded-full border border-border bg-surface-band px-3.5 py-1.5 text-xs font-semibold text-ink hover:text-action hover:border-action hover:bg-surface-subtle transition cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results Area */}
        <div className="space-y-8">
          {/* 1. Products Results */}
          {(activeTab === "ALL" || activeTab === "PRODUCTS") && filteredProducts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-ink tracking-tight font-display">
                  Products & Services ({filteredProducts.length})
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {filteredProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/app/product/${product.id}`}
                    className="group relative flex flex-col justify-between rounded-3xl border border-border bg-surface-raised p-3.5 sm:p-4 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-border-strong hover:shadow-soft select-none"
                  >
                    <div>
                      {/* Product Image + Pastel container */}
                      <div className="relative mx-auto flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center my-1 rounded-2xl bg-surface-band border border-border overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute -bottom-1 -right-1 z-20 h-7 w-7 rounded-full bg-surface-raised border border-border p-0.5 shadow-xs flex items-center justify-center">
                          <CatalogSvgIllustration idOrCategory={product.category} size={18} />
                        </div>
                        {product.isBestSeller && (
                          <span className="absolute top-1 right-1 z-20 rounded-full bg-coral px-2 py-0.5 text-[9px] font-bold text-white shadow-xs">
                            TOP
                          </span>
                        )}
                      </div>

                      {/* Product Title & Vendor */}
                      <div className="mt-3">
                        <h3 className="text-sm font-bold text-ink line-clamp-1 group-hover:text-action transition-colors font-display">
                          {product.name}
                        </h3>
                        <p className="text-[11px] text-ink-muted line-clamp-1 mt-0.5">
                          {product.vendorName}
                        </p>
                      </div>

                      {/* Price Display */}
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

                    {/* Bottom Meta & Action Row */}
                    <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[10px] text-ink-muted font-medium">
                        <Clock size={11} className="text-coral" />
                        <span>{product.deliveryWindow || "Morning"}</span>
                      </div>

                      {/* Action Button (+) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToCart(product, 1);
                          setIsCartOpen(true);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-action text-white shadow-xs hover:bg-action-hover transition-colors cursor-pointer"
                        aria-label={`Add ${product.name}`}
                      >
                        <Plus size={16} className="stroke-[3]" />
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 2. Vendors Results */}
          {(activeTab === "ALL" || activeTab === "VENDORS") && filteredVendors.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-ink tracking-tight font-display">
                  Society Merchants & Partners ({filteredVendors.length})
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {filteredVendors.map((vendor) => (
                  <Link
                    key={vendor.id}
                    href={`/app/vendor/${vendor.id}`}
                    className="group relative overflow-hidden rounded-3xl border border-border bg-surface-raised shadow-card hover:shadow-soft transition-all"
                  >
                    <div className="relative h-44 w-full">
                      <img
                        src={vendor.bannerImage || vendor.image}
                        alt={vendor.name}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                      <div className="absolute top-3 right-3">
                        <span className="rounded-full bg-coral px-3 py-1 text-xs font-bold text-white shadow-xs">
                          {vendor.deliveryWindow}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-white group-hover:text-coral transition-colors font-display">
                            {vendor.name}
                          </h3>
                          <p className="text-xs text-white/90 flex items-center gap-1 mt-0.5">
                            <MapPin size={12} className="text-coral" />
                            {vendor.address.split(",")[0]} · ★ {vendor.rating} ({vendor.reviewCount} reviews)
                          </p>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-action transition">
                          <ArrowRight size={14} />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 3. Empty State */}
          {totalResults === 0 && (
            <div className="py-16 text-center rounded-3xl border border-border bg-surface-raised p-8 space-y-4 shadow-card">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-coral/15 text-action border border-coral/30">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-ink font-display">No matches found</h3>
                <p className="text-xs text-ink-muted max-w-sm mx-auto">
                  We couldn&apos;t find any items or merchants matching &ldquo;{query}&rdquo;. Try another keyword or reset your filters.
                </p>
              </div>
              <DSButton variant="secondary" size="sm" onClick={clearAllFilters}>
                Clear All Filters
              </DSButton>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
