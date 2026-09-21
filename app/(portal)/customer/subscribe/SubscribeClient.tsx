"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@hexclave/next";
import { Subscription } from "@/src/modules/subscriptions/subscription-schema";
import {
  ArrowRight,
  Calendar,
  Check,
  ChefHat,
  CircleAlert,
  Clock,
  Lock,
  Pause,
  Play,
  Plus,
  Receipt,
  Sparkles,
  Star,
  Users,
  Utensils,
  X,
} from "@/components/icons/animated";
import { RuxsCardListSkeleton, RuxsSpinner } from "@/components/ui/LoadingState";
import { formatINR, Paise } from "@/src/shared/types/money";

interface MarketVendor {
  id: string;
  businessName: string;
  slug: string;
  vendorType: "MILKMAN" | "WATER_SERVICE" | "TIFFIN" | "FLOWERS" | "PET_SERVICES" | "LAUNDRY";
  locality: string;
  city: string;
  coveredSocieties: string[];
  rating: number;
  reviewCount: number;
  deliverySlots: string[];
  shifts?: Array<{
    id: string;
    name?: string;
    label?: string;
    timing: string;
    cutoff?: string;
    cutoffTime?: string;
    menuToday?: string;
    pricePaise: number;
    menu?: {
      title?: string;
      items?: string[];
      diet?: string;
    };
  }>;
  varieties?: Array<{
    id: string;
    name: string;
    unit: string;
    pricePaise: number;
    fatPercentage?: string;
    container?: string;
  }>;
  services?: Array<{
    id: string;
    category: string;
    name: string;
    description: string;
    cutoffTimeStr: string;
    products: Array<{
      id: string;
      name: string;
      unitType: string;
      basePricePaise: number;
    }>;
  }>;
}

const cadences = [
  { id: "DAILY", label: "Every day" },
  { id: "WEEKDAYS", label: "Mon–Fri" },
  { id: "ALTERNATE_DAYS", label: "Alternate days" },
] as const;

const SERVICE_CATEGORIES = [
  { id: "ALL", label: "All Services", emoji: "⚡" },
  { id: "WATER_SERVICE", label: "Water Cans", emoji: "💧" },
  { id: "MILKMAN", label: "Milk & Dairy", emoji: "🥛" },
  { id: "TIFFIN", label: "Tiffin & Meals", emoji: "🍱" },
  { id: "FLOWERS", label: "Puja Flowers", emoji: "🌸" },
  { id: "PET_SERVICES", label: "Pet Care", emoji: "🐾" },
  { id: "LAUNDRY", label: "Iron & Wash", emoji: "🧺" },
] as const;

const VENDOR_TYPE_META: Record<string, { emoji: string; label: string; defaultProduct: string; unit: string; price: number }> = {
  WATER_SERVICE: { emoji: "💧", label: "Water Cans", defaultProduct: "20L Bisleri Water Can", unit: "CAN", price: 4000 },
  MILKMAN: { emoji: "🥛", label: "Milk & Dairy", defaultProduct: "Daily Pure Farm Fresh Milk", unit: "L", price: 6500 },
  TIFFIN: { emoji: "🍱", label: "Tiffin & Meals", defaultProduct: "Standard Homestyle Thali", unit: "MEAL", price: 12000 },
  FLOWERS: { emoji: "🌸", label: "Puja Flowers", defaultProduct: "Fresh Morning Puja Flower Basket", unit: "PACK", price: 1500 },
  PET_SERVICES: { emoji: "🐾", label: "Pet Care", defaultProduct: "Daily Evening Dog Walk & Feed", unit: "WALK", price: 25000 },
  LAUNDRY: { emoji: "🧺", label: "Iron & Wash", defaultProduct: "Daily Garment Steam Iron Pass", unit: "PIECE", price: 500 },
};

function SubscribeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useUser();
  const customerId = user?.id || "";

  const [vendors, setVendors] = useState<MarketVendor[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [selectedShiftId, setSelectedShiftId] = useState<string>("AFTERNOON");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [cadence, setCadence] = useState<"DAILY" | "WEEKDAYS" | "ALTERNATE_DAYS">("DAILY");
  const [quantity, setQuantity] = useState(1);
  const [autopilotDefault, setAutopilotDefault] = useState<"CONFIRMED" | "SKIPPED">("CONFIRMED");
  const [instructions, setInstructions] = useState("");

  // 1. Fetch marketplace vendors from DB
  useEffect(() => {
    async function loadVendors() {
      try {
        setVendorsLoading(true);
        const res = await fetch("/api/marketplace/vendors");
        const json = (await res.json()) as { success: boolean; data?: MarketVendor[] };
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setVendors(json.data);

          // Check if pre-selected from URL query ?vendor=... or ?category=...
          const paramVendorSlug = searchParams.get("vendor");
          const paramShift = searchParams.get("shift");
          const paramCategory = searchParams.get("category");

          if (paramCategory && SERVICE_CATEGORIES.some((c) => c.id === paramCategory)) {
            setSelectedCategory(paramCategory);
          }

          let initialVendor = json.data[0];
          if (paramVendorSlug) {
            const found = json.data.find(
              (v) => v.slug === paramVendorSlug || v.id === paramVendorSlug
            );
            if (found) {
              initialVendor = found;
              setSelectedCategory(found.vendorType);
            }
          }

          setSelectedVendorId(initialVendor.id);

          // Initial shift
          if (paramShift && initialVendor.shifts?.some((s) => s.id === paramShift)) {
            setSelectedShiftId(paramShift);
          } else if (initialVendor.shifts && initialVendor.shifts.length > 0) {
            setSelectedShiftId(initialVendor.shifts[0].id);
          }

          // Initial product
          const allProducts = initialVendor.services?.flatMap((s) => s.products) || [];
          if (allProducts.length > 0) {
            setSelectedProductId(allProducts[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load vendors for subscription:", err);
      } finally {
        setVendorsLoading(false);
      }
    }

    void loadVendors();
  }, [searchParams]);

  // Filtered vendors by selected category
  const filteredVendors = useMemo(() => {
    if (selectedCategory === "ALL") return vendors;
    return vendors.filter((v) => v.vendorType === selectedCategory);
  }, [vendors, selectedCategory]);

  // Selected vendor reference
  const selectedVendor = useMemo(() => {
    return vendors.find((v) => v.id === selectedVendorId) || filteredVendors[0] || vendors[0];
  }, [vendors, filteredVendors, selectedVendorId]);

  // Available products for current vendor
  const availableProducts = useMemo(() => {
    if (!selectedVendor) return [];
    const fromServices = selectedVendor.services?.flatMap((s) => s.products) || [];
    if (fromServices.length > 0) return fromServices;

    // Fallback if structured as varieties
    if (selectedVendor.varieties && selectedVendor.varieties.length > 0) {
      return selectedVendor.varieties.map((v) => ({
        id: v.id,
        name: v.name,
        unitType: v.unit,
        basePricePaise: v.pricePaise,
      }));
    }

    const meta = (selectedVendor && VENDOR_TYPE_META[selectedVendor.vendorType]) || {
      emoji: "📦",
      label: "Routine",
      defaultProduct: "Standard Subscription Item",
      unit: "ITEM",
      price: 5000,
    };

    return [
      {
        id: `prd_${selectedVendor.id}_standard`,
        name: meta.defaultProduct,
        unitType: meta.unit,
        basePricePaise: meta.price,
      },
    ];
  }, [selectedVendor]);

  // Ensure selectedProductId is valid when vendor changes
  useEffect(() => {
    if (availableProducts.length > 0) {
      const exists = availableProducts.some((p) => p.id === selectedProductId);
      if (!exists) {
        setSelectedProductId(availableProducts[0].id);
      }
    }
  }, [availableProducts, selectedProductId]);

  // Ensure selectedShiftId is valid when vendor changes
  useEffect(() => {
    if (selectedVendor?.shifts && selectedVendor.shifts.length > 0) {
      const exists = selectedVendor.shifts.some((s) => s.id === selectedShiftId);
      if (!exists) {
        setSelectedShiftId(selectedVendor.shifts[0].id);
      }
    }
  }, [selectedVendor, selectedShiftId]);

  const activeShift = useMemo(() => {
    return selectedVendor?.shifts?.find((s) => s.id === selectedShiftId);
  }, [selectedVendor, selectedShiftId]);

  const selectedProduct = useMemo(() => {
    return availableProducts.find((p) => p.id === selectedProductId) || availableProducts[0];
  }, [availableProducts, selectedProductId]);

  // Unit price in paise
  const effectiveUnitPricePaise = useMemo(() => {
    if (activeShift?.pricePaise && selectedVendor?.vendorType === "TIFFIN") {
      return activeShift.pricePaise;
    }
    return selectedProduct?.basePricePaise || 12000;
  }, [activeShift, selectedProduct, selectedVendor]);

  // 2. Fetch customer subscriptions
  const fetchSubscriptions = async () => {
    if (!customerId) {
      setSubscriptions([]);
      setLoadingSubs(false);
      return;
    }

    setLoadingSubs(true);
    try {
      const res = await fetch("/api/subscriptions?customerId=" + customerId);
      const data = (await res.json()) as { success: boolean; data?: Subscription[] };
      setSubscriptions(data.success && data.data ? data.data : []);
    } catch (fetchError) {
      console.error(fetchError);
      setSubscriptions([]);
    } finally {
      setLoadingSubs(false);
    }
  };

  useEffect(() => {
    void fetchSubscriptions();
  }, [customerId]);

  const handleCreateSubscription = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user) {
      router.push("/login?redirect=/customer/subscribe");
      return;
    }

    if (!selectedVendor || !selectedProduct) return;

    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: selectedVendor.id,
          customerId,
          productId: selectedProduct.id,
          productName: `${selectedProduct.name} (${activeShift?.name || (activeShift as any)?.label || selectedVendor.businessName})`,
          unitPricePaise: effectiveUnitPricePaise,
          cadence,
          shift: selectedShiftId,
          defaultQuantity: Number(quantity),
          autopilotDefault,
          instructions: instructions.trim() || undefined,
          startDate: new Date().toISOString().split("T")[0],
        }),
      });

      const data = (await response.json()) as {
        success: boolean;
        data?: Subscription;
        error?: { message: string };
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to create subscription");
      }

      setSuccessMsg(`Successfully subscribed to ${selectedVendor.businessName}! Delivery routine activated.`);
      setInstructions("");
      await fetchSubscriptions();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create subscription");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id: string, action: "pause" | "resume" | "cancel") => {
    try {
      const response = await fetch("/api/subscriptions/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = (await response.json()) as { success: boolean };
      if (data.success) await fetchSubscriptions();
    } catch (actionError) {
      console.error(actionError);
    }
  };

  const monthlyEstimate = useMemo(() => {
    const frequency = cadence === "DAILY" ? 30 : cadence === "WEEKDAYS" ? 22 : 15;
    return (effectiveUnitPricePaise * quantity * frequency) / 100;
  }, [cadence, effectiveUnitPricePaise, quantity]);

  if (vendorsLoading) {
    return (
      <div className="mx-auto w-full max-w-[1180px] px-4 py-8">
        <RuxsCardListSkeleton count={4} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="space-y-6">
        <section className="rounded-[28px] border border-white/[0.08] bg-[radial-gradient(circle_at_top_right,rgba(159,197,143,0.11),transparent_38%),rgba(16,20,18,0.76)] p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em]">
                <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-primary">Recurring services</span>
                <span className="text-subtle">Synced with live society merchants</span>
              </div>
              <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Build your everyday routine.</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                Choose your local verified vendor, preferred delivery shift, and quantity. RUXS runs autopilot door-to-door deliveries on your schedule.
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4 py-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-subtle">Estimated monthly run-rate</p>
              <p className="mt-1 text-lg font-semibold text-primary">${monthlyEstimate.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
          {/* Subscription Creator Form */}
          <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Plus size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold">Start a recurring service</p>
                <p className="mt-1 text-xs text-muted-foreground">Select local vendor, shift timing, and daily meal/delivery plan.</p>
              </div>
            </div>

            {error && (
              <div className="mt-5 flex items-start gap-2 rounded-2xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                <CircleAlert size={15} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mt-5 flex items-start gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                <Check size={15} className="mt-0.5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubscription} className="mt-6 space-y-5">
              {/* STEP 1: Select Vendor */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-subtle">1. Select Local Merchant</label>
                  <span className="text-[10px] text-muted-foreground">{filteredVendors.length} verified vendors</span>
                </div>

                {/* Service Category Pills */}
                <div className="mb-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {SERVICE_CATEGORIES.map((cat) => {
                    const active = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          const matching = cat.id === "ALL" ? vendors : vendors.filter((v) => v.vendorType === cat.id);
                          if (matching.length > 0 && !matching.some((m) => m.id === selectedVendorId)) {
                            setSelectedVendorId(matching[0].id);
                          }
                        }}
                        className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                          active
                            ? "bg-primary text-primary-foreground shadow"
                            : "border border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
                        }`}
                      >
                        <span>{cat.emoji}</span>
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredVendors.map((v) => {
                    const isSelected = v.id === selectedVendorId;
                    const meta = VENDOR_TYPE_META[v.vendorType] || { emoji: "📦", label: v.vendorType };
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setSelectedVendorId(v.id);
                          if (v.shifts && v.shifts.length > 0) {
                            setSelectedShiftId(v.shifts[0].id);
                          }
                        }}
                        className={`rounded-2xl border p-3.5 text-left transition ${
                          isSelected
                            ? "border-primary/40 bg-primary/[0.08] shadow-sm"
                            : "border-white/[0.08] bg-white/[0.015] hover:border-white/[0.14] hover:bg-white/[0.03]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base">{meta.emoji}</span>
                            <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[9px] font-medium text-muted-foreground">
                              {meta.label}
                            </span>
                          </div>
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400">
                            <Star size={11} className="fill-amber-400" />
                            {v.rating}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs font-semibold text-foreground truncate">{v.businessName}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground truncate">{v.locality}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 2: Shift Timing Selection (if vendor provides shifts) */}
              {selectedVendor?.shifts && selectedVendor.shifts.length > 0 && (
                <div>
                  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-subtle">
                    2. Delivery Shift & Menu Timing
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedVendor.shifts.map((s) => {
                      const isShiftActive = s.id === selectedShiftId;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedShiftId(s.id)}
                          className={`rounded-2xl border p-3.5 text-left transition ${
                            isShiftActive
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-white/[0.08] bg-white/[0.015] text-muted-foreground hover:bg-white/[0.03]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-foreground">{s.name || (s as any).label || s.id}</p>
                            <span className="rounded-md border border-white/[0.1] bg-black/20 px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">
                              Cutoff {s.cutoffTime || (s as any).cutoff || "Standard"}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-subtle">{s.timing}</p>
                          {s.pricePaise > 0 && (
                            <p className="mt-1 text-xs font-semibold text-primary">{formatINR(s.pricePaise as Paise)} / meal</p>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Shift Menu Details Box */}
                  {Boolean(activeShift && (activeShift.menuToday || (activeShift as any)?.menu?.items)) && (
                    <div className="mt-3 rounded-2xl border border-primary/20 bg-primary/[0.04] p-4 text-xs">
                      <div className="flex items-center gap-2 font-semibold text-primary">
                        <ChefHat size={14} />
                        <span>Today&apos;s Menu ({activeShift?.name || (activeShift as any)?.label || "Selected"}):</span>
                      </div>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-foreground">
                        {activeShift?.menuToday || ((activeShift as any)?.menu?.items ? (activeShift as any).menu.items.join(", ") : "")}
                      </p>
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        Order modifications and skips are accepted until daily cutoff at {activeShift?.cutoffTime || (activeShift as any)?.cutoff || "10:00 AM"}.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Product / Plan Selection */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-subtle">
                    {selectedVendor?.shifts?.length ? "3. Confirm Service Plan" : "2. Select Product / Pack"}
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    {availableProducts.length} option{availableProducts.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-2">
                  {availableProducts.map((p) => {
                    const isSelected = p.id === selectedProductId;
                    const displayPrice = activeShift?.pricePaise && selectedVendor?.vendorType === "TIFFIN" ? activeShift.pricePaise : p.basePricePaise;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedProductId(p.id)}
                        className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
                          isSelected
                            ? "border-primary/40 bg-primary/[0.07]"
                            : "border-white/[0.08] bg-white/[0.015] hover:border-white/[0.14] hover:bg-white/[0.03]"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            isSelected ? "bg-primary/10 text-primary" : "bg-white/[0.04] text-subtle"
                          }`}>
                            <Utensils size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-foreground">{p.name}</p>
                            <p className="mt-0.5 text-[10px] text-muted-foreground">{selectedVendor.businessName}</p>
                          </div>
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-primary">
                          {formatINR(displayPrice as Paise)} / {p.unitType.toLowerCase()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 4: Delivery Cadence */}
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-subtle">
                  Delivery cadence
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {cadences.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCadence(item.id)}
                      className={
                        cadence === item.id
                          ? "rounded-xl border border-primary/30 bg-primary/10 px-3 py-2.5 text-xs font-semibold text-primary"
                          : "rounded-xl border border-white/[0.08] bg-white/[0.015] px-3 py-2.5 text-xs text-muted-foreground transition hover:bg-white/[0.04] hover:text-foreground"
                      }
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity & Autopilot */}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="rounded-2xl border border-white/[0.08] bg-white/[0.015] p-4">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle">Daily quantity</span>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] text-muted-foreground hover:bg-white/[0.04]"
                    >
                      −
                    </button>
                    <input
                      value={quantity}
                      onChange={(event) => setQuantity(Math.min(10, Math.max(1, Number(event.target.value) || 1)))}
                      type="number"
                      min="1"
                      max="10"
                      className="h-9 w-full rounded-xl border border-white/[0.08] bg-transparent px-3 text-center text-sm outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(10, quantity + 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] text-muted-foreground hover:bg-white/[0.04]"
                    >
                      +
                    </button>
                  </div>
                </label>

                <label className="rounded-2xl border border-white/[0.08] bg-white/[0.015] p-4">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle">Autopilot rule</span>
                  <select
                    value={autopilotDefault}
                    onChange={(event) => setAutopilotDefault(event.target.value as "CONFIRMED" | "SKIPPED")}
                    className="mt-3 h-9 w-full rounded-xl border border-white/[0.08] bg-[#0b0d0c] px-3 text-xs outline-none text-foreground"
                  >
                    <option value="CONFIRMED">Auto-deliver (skip manually)</option>
                    <option value="SKIPPED">Ask before delivery (WhatsApp)</option>
                  </select>
                </label>
              </div>

              {/* Delivery Instructions */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle mb-1">
                  Delivery instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Leave outside flat door, ring once, don't knock if before 7am"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 text-xs text-foreground outline-none focus:border-primary/40"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground transition hover:brightness-105 disabled:opacity-50 shadow-lg"
              >
                {submitting ? (
                  <>
                    <RuxsSpinner size="sm" color="text-primary-foreground" />
                    <span>Creating your routine…</span>
                  </>
                ) : (
                  <>
                    <span>{user ? `Start ${selectedVendor.businessName} Service` : "Sign in to start"}</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          </section>

          {/* Active Subscriptions List */}
          <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <p className="text-sm font-semibold">Active routines</p>
                <p className="mt-1 text-xs text-muted-foreground">Managed on daily autopilot.</p>
              </div>
              <span className="rounded-full border border-white/[0.1] bg-white/[0.02] px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
                {subscriptions.length} active
              </span>
            </div>

            <div className="mt-4 divide-y divide-white/[0.07]">
              {loadingSubs ? (
                <div className="py-6">
                  <RuxsCardListSkeleton count={2} />
                </div>
              ) : subscriptions.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  <Calendar size={24} className="mx-auto mb-2 text-subtle" />
                  No recurring services configured yet.
                  <br />
                  Select a merchant on the left to activate autopilot deliveries.
                </div>
              ) : (
                subscriptions.map((sub) => (
                  <div key={sub.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold truncate text-foreground">{sub.productName}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${
                          sub.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          {sub.status}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {sub.cadence} · {sub.defaultQuantity} units · {formatINR(sub.unitPricePaise)}
                        {sub.shift ? ` · ${sub.shift}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAction(sub.id, sub.status === "ACTIVE" ? "pause" : "resume")}
                        className="rounded-lg border border-white/[0.1] bg-white/[0.02] px-2.5 py-1 text-[10px] font-medium text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
                      >
                        {sub.status === "ACTIVE" ? "Pause" : "Resume"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Are you sure you want to cancel this recurring subscription?")) {
                            void handleAction(sub.id, "cancel");
                          }
                        }}
                        className="rounded-lg border border-white/[0.1] bg-white/[0.02] px-2 py-1 text-[10px] font-medium text-destructive hover:bg-destructive/10"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function SubscribeClient() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1180px] p-8"><RuxsCardListSkeleton count={3} /></div>}>
      <SubscribeContent />
    </Suspense>
  );
}
