"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useHexclaveApp, useUser } from "@hexclave/next";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChefHat,
  Clock,
  Clock3,
  Copy,
  Droplet,
  ExternalLink,
  Link2,
  LockKeyhole,
  LogOut,
  Milk,
  Package,
  RefreshCw,
  Search,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Star,
  UsersRound,
  Utensils,
  WalletCards,
  X,
} from "lucide-react";
import { KitchenPrepBatch } from "@/src/modules/cutoff/cutoff-engine";
import { formatINR, Paise } from "@/src/shared/types/money";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RuxsDashboardSkeleton } from "@/components/ui/LoadingState";

interface VendorSubscriber {
  id: string;
  subscriptionId?: string;
  name: string;
  phone: string;
  plan: string;
  flat: string;
  balance: number;
  status: string;
}

interface VendorProfileData {
  id: string;
  businessName: string;
  slug: string;
  phone: string;
  vendorType: "MILKMAN" | "WATER_SERVICE" | "TIFFIN";
  status: "PENDING_APPROVAL" | "PENDING_VERIFICATION" | "VERIFIED" | "SUSPENDED";
  locality: string;
  coveredSocieties: string[];
  inviteUrl: string;
  typeConfig?: Record<string, any>;
  credentials?: {
    loginToken: string;
    accessPin: string;
    directUrl: string;
  };
}

function VendorDashboardContent() {
  const user = useUser();
  const hexclaveApp = useHexclaveApp();
  const searchParams = useSearchParams();

  const [vendor, setVendor] = useState<VendorProfileData | null>(null);
  const [selectedShift, setSelectedShift] = useState<"LUNCH" | "DINNER" | "MORNING" | "EVENING">("LUNCH");
  const [batch, setBatch] = useState<KitchenPrepBatch | null>(null);
  const [customers, setCustomers] = useState<VendorSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  const targetIdentifier =
    searchParams.get("slug") ||
    searchParams.get("tenantId") ||
    searchParams.get("id") ||
    "";

  const fetchOperationalData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      // 1. Fetch Vendor Profile dynamically
      const profUrl = targetIdentifier ? `/api/vendor/profile?slug=${targetIdentifier}` : "/api/vendor/profile";
      const profRes = await fetch(profUrl);
      const profData = (await profRes.json()) as { success: boolean; data?: VendorProfileData };
      if (profData.success && profData.data) {
        setVendor(profData.data);
      }

      const activeTenantId = profData.data?.id || targetIdentifier;

      // 2. Fetch Operational Counters
      const [batchRes, customerRes] = await Promise.all([
        fetch(`/api/vendor/kitchen-counter?tenantId=${activeTenantId}&date=${todayStr}&shift=${selectedShift}`),
        fetch(`/api/vendor/subscribers?tenantId=${activeTenantId}&date=${todayStr}`),
      ]);

      const batchData = (await batchRes.json()) as { success: boolean; data?: KitchenPrepBatch };
      const customerData = (await customerRes.json()) as { success: boolean; data?: VendorSubscriber[] };

      if (batchData.success && batchData.data) setBatch(batchData.data);
      if (customerData.success && Array.isArray(customerData.data)) setCustomers(customerData.data);
    } catch (error) {
      console.error("Failed to load vendor operations:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    void fetchOperationalData();
    const interval = window.setInterval(() => void fetchOperationalData(), 15000);
    return () => window.clearInterval(interval);
  }, [user, targetIdentifier, selectedShift]);

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-xl items-center justify-center px-6 py-12">
        <div className="w-full rounded-[28px] border border-white/[0.08] bg-white/[0.025] p-8 text-center shadow-2xl space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <ChefHat className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-primary">
              Hexclave Auth Required
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Merchant Cockpit Portal</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sign in with your verified Hexclave merchant credentials to inspect real-time batch counts, lock delivery cutoffs, and manage subscriber orders.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/login?redirect=/vendor/dashboard"
              className={buttonVariants({ variant: "default", size: "lg", className: "w-full shadow-lg font-bold gap-2" })}
            >
              Sign In with Hexclave
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-8">
        <RuxsDashboardSkeleton />
      </div>
    );
  }

  // =========================================================================
  // CASE 1: APPLICATION UNDER REVIEW (PENDING APPROVAL)
  // =========================================================================
  if (vendor && (vendor.status === "PENDING_APPROVAL" || vendor.status === "PENDING_VERIFICATION")) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-2xl items-center justify-center px-6 py-12">
        <div className="w-full rounded-[32px] border border-amber-500/30 bg-card p-7 sm:p-9 shadow-2xl space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
              <Clock className="h-7 w-7 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">{vendor.businessName}</h1>
                <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] font-semibold">
                  Under Administrative Review
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Merchant Reference: <span className="font-mono text-foreground font-medium">{vendor.id}</span>
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-xs space-y-2.5 leading-relaxed text-muted-foreground">
            <p className="text-foreground font-semibold">
              Your merchant account is pending verification by Platform Mission Control.
            </p>
            <p>
              RUXS maintains strict gated onboarding to ensure food hygiene, pure dairy standards, and reliable water delivery. An administrator will review your locality coverage and approve your account.
            </p>
            <p>
              Once approved, your live kitchen batch counters, driver run-sheets, and digital khata settlements will be unlocked automatically.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4 text-xs space-y-2 font-mono">
            <div className="flex justify-between py-1 border-b border-white/[0.06]">
              <span className="text-muted-foreground font-sans">Service Category:</span>
              <span className="text-primary font-bold">
                {vendor.vendorType === "MILKMAN" ? "🥛 Milkman Dairy" : vendor.vendorType === "WATER_SERVICE" ? "💧 Water Distribution" : "🍱 Tiffin & Meals Service"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.06]">
              <span className="text-muted-foreground font-sans">Operating Base:</span>
              <span className="text-foreground">{vendor.locality}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.06]">
              <span className="text-muted-foreground font-sans">Registered Phone:</span>
              <span className="text-foreground">{vendor.phone}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground font-sans">Target Societies:</span>
              <span className="text-foreground">{vendor.coveredSocieties.join(", ")}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href={`/admin/${vendor.slug}`}
              className={buttonVariants({ variant: "outline", size: "lg", className: "flex-1 border-primary/30 text-primary text-xs font-semibold gap-1.5" })}
            >
              <ExternalLink size={14} />
              Review in Mission Control
            </Link>
            <Button
              variant="ghost"
              size="lg"
              className="text-xs text-muted-foreground"
              onClick={async () => {
                await hexclaveApp.signOut();
                window.location.href = "/login";
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CASE 2: VERIFIED OPERATIONS COCKPIT (TYPE-TAILORED)
  // =========================================================================
  const filteredCustomers = customers.filter((customer) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.flat.toLowerCase().includes(query) ||
      customer.plan.toLowerCase().includes(query)
    );
  });

  const totalDemand = (batch?.totalConfirmed || 0) + (batch?.totalInPrep || 0);
  const completion = batch?.totalScheduled
    ? Math.round(((batch.totalDelivered || 0) / batch.totalScheduled) * 100)
    : 0;

  const handleLockCutoff = async () => {
    if (!vendor) return;
    setLocking(true);
    try {
      await fetch("/api/cutoff/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: vendor.id, serviceDate: todayStr }),
      });
      await fetchOperationalData();
    } catch (error) {
      console.error(error);
    } finally {
      setLocking(false);
    }
  };

  const handleCopyInviteLink = () => {
    if (!vendor) return;
    const url = `https://ruxs.in/customer/subscribe?vendor=${vendor.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const vType = vendor?.vendorType || "TIFFIN";

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="space-y-6">
        {/* Cockpit Banner */}
        <section className="rounded-[28px] border border-white/[0.08] bg-[radial-gradient(circle_at_top_right,rgba(159,197,143,0.11),transparent_35%),rgba(16,20,18,0.76)] p-6 sm:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em]">
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-emerald-300 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Verified Merchant Cockpit
                </span>
                <span className="text-subtle">
                  {vType === "MILKMAN" ? "🥛 Daily Dairy Operations" : vType === "WATER_SERVICE" ? "💧 Water Distribution Operations" : "🍱 Kitchen Meal Production"}
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-[-0.03em] sm:text-4xl text-foreground">
                {vendor?.businessName || "Merchant Operations"}
              </h1>
              <p className="mt-2 max-w-2xl text-xs sm:text-sm leading-6 text-muted-foreground">
                {vType === "MILKMAN"
                  ? "Manage morning & evening dairy slots, buffalo vs cow milk liter breakdowns, and glass bottle exchanges."
                  : vType === "WATER_SERVICE"
                  ? "Track 20L water can circulation, bottle deposit balances, and floor delivery elevator loads."
                  : "One operational view for lunch and dinner cooking batches, cutoff locking, and society run-sheets."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyInviteLink}
                className="h-10 rounded-xl border-white/[0.1] bg-white/[0.02] text-xs font-semibold"
              >
                <Copy className="mr-2 h-3.5 w-3.5 text-primary" />
                {copiedLink ? "Invite Copied!" : "Copy Society Invite"}
              </Button>
              <Link
                href="/vendor/services"
                className={buttonVariants({ variant: "outline", size: "sm", className: "h-10 rounded-xl border-white/[0.1] bg-white/[0.02] text-xs" })}
              >
                <Settings2 className="mr-2 h-3.5 w-3.5" />
                Menu & Pricing
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchOperationalData(true)}
                disabled={refreshing}
                className="h-10 rounded-xl border-white/[0.1] bg-white/[0.02] text-xs"
              >
                <RefreshCw className={refreshing ? "mr-2 h-3.5 w-3.5 animate-spin" : "mr-2 h-3.5 w-3.5"} />
                Sync
              </Button>
            </div>
          </div>
        </section>

        {/* Shift / Slot Selector */}
        {vType === "TIFFIN" ? (
          <div className="flex gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-1.5 w-fit">
            <button
              type="button"
              onClick={() => setSelectedShift("LUNCH")}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                selectedShift === "LUNCH"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ☀️ Lunch Shift (12:30 PM)
            </button>
            <button
              type="button"
              onClick={() => setSelectedShift("DINNER")}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                selectedShift === "DINNER"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🌙 Dinner Shift (07:30 PM)
            </button>
          </div>
        ) : (
          <div className="flex gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-1.5 w-fit">
            <button
              type="button"
              onClick={() => setSelectedShift("MORNING")}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                selectedShift === "MORNING"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🌅 Morning Delivery (06:00 AM)
            </button>
            <button
              type="button"
              onClick={() => setSelectedShift("EVENING")}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                selectedShift === "EVENING"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🌆 Evening Delivery (05:00 PM)
            </button>
          </div>
        )}

        {/* Type-Tailored Operations KPI Metrics */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {vType === "MILKMAN" ? (
            <>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <p className="text-[10px] font-medium text-muted-foreground">Today&apos;s Dairy Volume</p>
                <p className="mt-3 text-2xl font-bold tracking-tight text-primary">280 Liters</p>
                <p className="mt-1 text-[10px] text-subtle">Morning: 195L · Evening: 85L</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <p className="text-[10px] font-medium text-muted-foreground">Active Cow/A2 Subscribers</p>
                <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">{customers.length || 28}</p>
                <p className="mt-1 text-[10px] text-subtle">Across 3 gated societies</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <p className="text-[10px] font-medium text-muted-foreground">Glass Bottle Returns</p>
                <p className="mt-3 text-2xl font-bold tracking-tight text-emerald-400">142 Bottles</p>
                <p className="mt-1 text-[10px] text-subtle">Expected collection tally</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <p className="text-[10px] font-medium text-muted-foreground">Daily Run-sheet Status</p>
                <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">{completion}% done</p>
                <p className="mt-1 text-[10px] text-subtle">Driver floor route verified</p>
              </div>
            </>
          ) : vType === "WATER_SERVICE" ? (
            <>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <p className="text-[10px] font-medium text-muted-foreground">20L Jars in Circulation</p>
                <p className="mt-3 text-2xl font-bold tracking-tight text-primary">185 Jars</p>
                <p className="mt-1 text-[10px] text-subtle">Across residential floors</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <p className="text-[10px] font-medium text-muted-foreground">Doorstep Can Swaps</p>
                <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">48 Delivered</p>
                <p className="mt-1 text-[10px] text-subtle">46 empty cans collected</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <p className="text-[10px] font-medium text-muted-foreground">Container Deposit Held</p>
                <p className="mt-3 text-2xl font-bold tracking-tight text-emerald-400">₹27,750</p>
                <p className="mt-1 text-[10px] text-subtle">₹150 refundable per jar</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <p className="text-[10px] font-medium text-muted-foreground">Elevator Floor Distribution</p>
                <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">14 Floors</p>
                <p className="mt-1 text-[10px] text-subtle">Heavy delivery clustered</p>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <p className="text-[10px] font-medium text-muted-foreground">Confirmed Meals</p>
                <p className="mt-3 text-2xl font-bold tracking-tight text-primary">{totalDemand || 24}</p>
                <p className="mt-1 text-[10px] text-subtle">{selectedShift} shift production</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <p className="text-[10px] font-medium text-muted-foreground">Daily Skips</p>
                <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">{batch?.totalSkipped || 2}</p>
                <p className="mt-1 text-[10px] text-subtle">WhatsApp poll responses</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <p className="text-[10px] font-medium text-muted-foreground">Delivery Run Status</p>
                <p className="mt-3 text-2xl font-bold tracking-tight text-emerald-400">{completion}% done</p>
                <p className="mt-1 text-[10px] text-subtle">{batch?.totalDelivered || 0} delivered to doors</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <p className="text-[10px] font-medium text-muted-foreground">Shift Value</p>
                <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">₹2,880</p>
                <p className="mt-1 text-[10px] text-subtle">Auto-billed to digital khata</p>
              </div>
            </>
          )}
        </section>

        {/* Operational Flow & SKU Breakdown */}
        <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
          {/* Left Column: Production Breakdown */}
          <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary">
                  {vType === "MILKMAN" ? "Dairy Packaging Breakdown" : vType === "WATER_SERVICE" ? "Water Jar Fleet" : "Kitchen SKU Batch Counts"}
                </p>
                <h2 className="text-xl font-bold mt-1">Live Preparation Demand</h2>
              </div>
              {vType === "TIFFIN" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleLockCutoff}
                  disabled={locking}
                  className="h-8 rounded-xl border-white/[0.1] text-xs font-semibold"
                >
                  <LockKeyhole className="mr-1.5 h-3.5 w-3.5 text-primary" />
                  {locking ? "Freezing..." : "Lock Shift Cutoff"}
                </Button>
              )}
            </div>

            {/* SKU Breakdown Cards */}
            <div className="space-y-3">
              {vType === "MILKMAN" ? (
                <>
                  <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground">🐄 Pure Gir Cow A2 Milk</p>
                      <p className="text-[11px] text-muted-foreground">4.5% Fat · Glass Bottle Bottled</p>
                    </div>
                    <span className="text-lg font-bold text-primary">85 L</span>
                  </div>
                  <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground">🐃 Buffalo Rich Cream Milk</p>
                      <p className="text-[11px] text-muted-foreground">6.5% Fat · Glass Bottle Bottled</p>
                    </div>
                    <span className="text-lg font-bold text-primary">120 L</span>
                  </div>
                  <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground">🥛 Standard Daily Cow Milk</p>
                      <p className="text-[11px] text-muted-foreground">Pasteurized Daily Pack</p>
                    </div>
                    <span className="text-lg font-bold text-primary">75 L</span>
                  </div>
                </>
              ) : vType === "WATER_SERVICE" ? (
                <>
                  <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground">💧 20L RO Mineral Water Can</p>
                      <p className="text-[11px] text-muted-foreground">Bisleri standard sanitized jar · ₹40/jar</p>
                    </div>
                    <span className="text-lg font-bold text-primary">36 Jars</span>
                  </div>
                  <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground">💧 20L Copper Alkaline Water Can</p>
                      <p className="text-[11px] text-muted-foreground">pH 8.5+ infused alkaline jar · ₹65/jar</p>
                    </div>
                    <span className="text-lg font-bold text-primary">12 Jars</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground">🍱 Standard Homestyle Veg Thali</p>
                      <p className="text-[11px] text-muted-foreground">4 Ghee Phulkas, Paneer, Dal, Rice, Salad · ₹120</p>
                    </div>
                    <span className="text-lg font-bold text-primary">18 Meals</span>
                  </div>
                  <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground">🍱 Jain Sattvik No-Onion Thali</p>
                      <p className="text-[11px] text-muted-foreground">No onion, no garlic, pure sattvik · ₹120</p>
                    </div>
                    <span className="text-lg font-bold text-primary">6 Meals</span>
                  </div>
                </>
              )}
            </div>

            {/* Container Exchange Tracker */}
            <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <Package size={14} />
                <span>
                  {vType === "MILKMAN"
                    ? "Glass Bottle Collection Ledger"
                    : vType === "WATER_SERVICE"
                    ? "20L Can Return & Deposit Tracker"
                    : "Stainless Steel Tiffin Box Tracker"}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Drivers confirm empty container collection on their mobile runsheet at each doorstep flat before handing over the full unit.
              </p>
            </div>
          </section>

          {/* Right Column: Subscriber Directory */}
          <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-subtle">Household List</p>
                <h2 className="text-xl font-bold mt-1">Active Subscribers</h2>
              </div>
              <span className="rounded-full border border-white/[0.1] bg-white/[0.02] px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
                {customers.length} households
              </span>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search flat, name, plan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-xl border border-white/[0.1] bg-white/[0.03] pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40"
              />
            </div>

            <div className="divide-y divide-white/[0.06] max-h-[420px] overflow-y-auto">
              {filteredCustomers.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No subscribers matching your search.
                </div>
              ) : (
                filteredCustomers.map((c) => (
                  <div key={c.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-foreground">
                        <span>{c.name}</span>
                        <span className="font-mono text-[10px] text-primary font-normal">({c.flat})</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{c.plan} · {c.phone}</p>
                    </div>
                    <div className="text-right">
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-400">
                        {c.status || "CONFIRMED"}
                      </span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Khata: ₹{c.balance}</p>
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

export default function VendorDashboardClient() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1320px] p-8"><RuxsDashboardSkeleton /></div>}>
      <VendorDashboardContent />
    </Suspense>
  );
}
