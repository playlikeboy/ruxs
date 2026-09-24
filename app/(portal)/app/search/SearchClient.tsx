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
  Flame,
  Plus,
  ShieldCheck,
  Building,
  Check,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import type { CatalogProduct, CatalogVendor, ServiceCategoryId } from "@/src/modules/customer-ui/types";
import { useCustomerUI } from "@/src/modules/customer-ui/context/CustomerUIContext";
import { CatalogSvgIllustration } from "@/src/modules/customer-ui/svg-assets";
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

  // Keep URL in sync with search input debounced
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (selectedCategory !== "ALL") params.set("category", selectedCategory);
    if (activeTab !== "ALL") params.set("type", activeTab.toLowerCase());
    if (priceFilter !== "ALL") params.set("price", priceFilter.toLowerCase());
    const newUrl = params.toString() ? `/app/search?${params.toString()}` : "/app/search";
    window.history.replaceState(null, "", newUrl);
  }, [query, selectedCategory, activeTab, priceFilter]);

  // Filter Products
  const filteredProducts = useMemo(() => {
    return catalog.products.filter((p) => {
      const matchesCategory = selectedCategory === "ALL" || p.category === selectedCategory;
      const matchesQuery =
        !query ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.vendorName.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase());

      const priceRupees = p.pricePaise / 100;
      let matchesPrice = true;
      if (priceFilter === "UNDER_500") matchesPrice = priceRupees < 500;
      else if (priceFilter === "500_TO_1000") matchesPrice = priceRupees >= 500 && priceRupees <= 1000;
      else if (priceFilter === "OVER_1000") matchesPrice = priceRupees > 1000;

      return matchesCategory && matchesQuery && matchesPrice;
    });
  }, [query, selectedCategory, priceFilter, catalog.products]);

  // Filter Vendors
  const filteredVendors = useMemo(() => {
    return catalog.vendors.filter((v) => {
      const matchesCategory = selectedCategory === "ALL" || v.category === selectedCategory;
      const matchesQuery =
        !query ||
        v.name.toLowerCase().includes(query.toLowerCase()) ||
        v.description.toLowerCase().includes(query.toLowerCase()) ||
        v.societiesCovered.some((s) => s.toLowerCase().includes(query.toLowerCase())) ||
        v.tags?.some((t) => t.toLowerCase().includes(query.toLowerCase()));

      return matchesCategory && matchesQuery;
    });
  }, [query, selectedCategory, catalog.vendors]);

  const totalResults =
    (activeTab === "ALL" || activeTab === "PRODUCTS" ? filteredProducts.length : 0) +
    (activeTab === "ALL" || activeTab === "VENDORS" ? filteredVendors.length : 0);

  const popularSearches = useMemo(
    () => [...catalog.products.slice(0, 6).map((product) => product.name), ...catalog.vendors.slice(0, 3).map((vendor) => vendor.name)],
    [catalog.products, catalog.vendors]
  );

  const clearAllFilters = () => {
    setQuery("");
    setSelectedCategory("ALL");
    setActiveTab("ALL");
    setPriceFilter("ALL");
  };

  return (
    <div className="min-h-screen bg-[#0b0f0d] text-foreground pb-24">
      {/* Top Search Sticky Bar */}
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#0b0f0d]/95 backdrop-blur-xl px-4 sm:px-8 py-3.5">
        <div className="mx-auto max-w-5xl flex items-center gap-3">
          <Link
            href="/app"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 transition-colors shadow-xs"
            aria-label="Back to App"
          >
            <ArrowLeft size={18} />
          </Link>

          {/* Search Input Box */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search milk, water cans, meals, vendors, societies..."
              autoFocus
              className="h-11 w-full rounded-2xl border border-white/[0.12] bg-white/[0.04] pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-emerald-500/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-emerald-500/20"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-muted-foreground hover:text-foreground transition"
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
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition select-none ${
                  activeTab === tab.id
                    ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                    : "border border-white/[0.08] bg-white/[0.025] text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Price Range Dropdown / Filter Pills */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <span className="text-gray-500 font-semibold mr-1">Price:</span>
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
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                  priceFilter === p.id
                    ? "border border-red-300 bg-red-50 text-red-600"
                    : "border border-gray-200 text-gray-600 hover:text-gray-900"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Horizontal Pills */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Filter by Category</span>
            {selectedCategory !== "ALL" && (
              <button
                type="button"
                onClick={() => setSelectedCategory("ALL")}
                className="text-red-500 font-bold hover:underline"
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
          <div className="rounded-3xl border border-white/[0.08] bg-[#121714] p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <Sparkles size={14} className="text-emerald-400" />
              <span>Trending Society Searches</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {popularSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQuery(term)}
                  className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-xs text-muted-foreground hover:text-white hover:border-emerald-500/40 hover:bg-emerald-500/10 transition"
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
                <h2 className="text-base font-bold text-white tracking-tight">
                  Products & Services ({filteredProducts.length})
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {filteredProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/app/product/${product.id}`}
                    className="group relative flex flex-col justify-between rounded-3xl border border-white/[0.08] bg-[#121714] p-3.5 sm:p-4 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/40 select-none"
                  >
                    <div>
                      {/* Floating Circular Image + SVG Badge */}
                      <div className="relative mx-auto flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center my-1">
                        <div className="absolute inset-0 rounded-full bg-black/40 blur-md translate-y-3" />
                        <img
                          src={product.image}
                          alt={product.name}
                          className="relative z-10 h-full w-full rounded-full object-cover"
                        />
                        {/* SVG Vector Badge floating */}
                        <div className="absolute -bottom-1 -right-1 z-20 h-8 w-8 rounded-full bg-white border border-gray-200 p-1 shadow-xs flex items-center justify-center">
                          <CatalogSvgIllustration idOrCategory={product.category} size={22} />
                        </div>
                        {product.isBestSeller && (
                          <span className="absolute top-0 right-0 z-20 rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-bold text-white shadow-xs">
                            TOP
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
                          {formatINR(product.pricePaise as Paise)}
                        </span>
                        {product.originalPricePaise && (
                          <span className="text-xs text-muted-foreground line-through">
                            {formatINR(product.originalPricePaise as Paise)}
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
                            <span>{product.calories} Cal</span>
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
                          addToCart(product, 1);
                          setIsCartOpen(true);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-xs hover:bg-red-600 transition-colors"
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
                <h2 className="text-base font-bold text-white tracking-tight">
                  Society Merchants & Kitchens ({filteredVendors.length})
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {filteredVendors.map((vendor) => (
                  <Link
                    key={vendor.id}
                    href={`/app/vendor/${vendor.id}`}
                    className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#121714] shadow-xl"
                  >
                    <div className="relative h-44 w-full">
                      <img
                        src={vendor.bannerImage || vendor.image}
                        alt={vendor.name}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                      <div className="absolute top-3 right-3">
                        <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-xs">
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
          )}

          {/* 3. Empty State */}
          {totalResults === 0 && (
            <div className="py-16 text-center rounded-3xl border border-gray-100 bg-white p-8 space-y-4 shadow-xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900">No matches found</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
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
