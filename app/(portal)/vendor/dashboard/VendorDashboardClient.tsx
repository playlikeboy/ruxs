"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useHexclaveApp, useUser } from "@hexclave/next";
import {
  ArrowUpRight,
  CheckCircle2,
  ChefHat,
  Clock3,
  Link2,
  LockKeyhole,
  LogOut,
  RefreshCw,
  Search,
  Settings2,
  UsersRound,
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

const tenantId = "ten_sharma_tiffin";

export default function VendorDashboardClient() {
  const user = useUser();
  const hexclaveApp = useHexclaveApp();
  const [batch, setBatch] = useState<KitchenPrepBatch | null>(null);
  const [customers, setCustomers] = useState<VendorSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];

  const fetchOperationalData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [batchRes, customerRes] = await Promise.all([
        fetch(`/api/vendor/kitchen-counter?tenantId=${tenantId}&date=${todayStr}&shift=LUNCH`),
        fetch(`/api/vendor/subscribers?tenantId=${tenantId}&date=${todayStr}`),
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
  }, [user]);

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
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Vendor Operations Hub</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sign in with your Hexclave account to inspect real-time batch counts, lock delivery cutoffs, and manage subscriber orders.
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

  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.flat.toLowerCase().includes(query) ||
        customer.plan.toLowerCase().includes(query)
    );
  }, [customers, searchQuery]);

  const totalDemand = (batch?.totalConfirmed || 0) + (batch?.totalInPrep || 0);
  const totalRevenuePaise = Object.values(batch?.skuBreakdown || {}).reduce(
    (total, item) => total + (item.totalPaise || 0),
    0
  );
  const completion = batch?.totalScheduled
    ? Math.round(((batch.totalDelivered || 0) / batch.totalScheduled) * 100)
    : 0;

  const handleLockCutoff = async () => {
    setLocking(true);
    try {
      await fetch("/api/cutoff/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, serviceDate: todayStr }),
      });
      await fetchOperationalData();
    } catch (error) {
      console.error(error);
    } finally {
      setLocking(false);
    }
  };

  if (loading) {
    return (
      <div className="py-2">
        <RuxsDashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="space-y-6">
        <section className="rounded-[28px] border border-white/[0.08] bg-[radial-gradient(circle_at_top_right,rgba(159,197,143,0.11),transparent_35%),rgba(16,20,18,0.76)] p-6 sm:p-8">
          <div className="flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em]">
                <span className="rounded-full border border-emerald-400/15 bg-emerald-400/5 px-2.5 py-1 text-emerald-300">
                  Live operations
                </span>
                <span className="text-subtle">{todayStr} · Lunch shift</span>
              </div>
              <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Kitchen operations</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                One operational view for today's demand, customer changes and the cutoff that turns confirmed orders into production.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/vendor/services" className={buttonVariants({ variant: "outline", size: "sm", className: "h-10 rounded-xl border-white/[0.1] bg-white/[0.02] text-xs" })}>
                <Settings2 className="mr-2 h-3.5 w-3.5" />
                Services
              </Link>
              <Link href="/vendor/onboard" className={buttonVariants({ variant: "outline", size: "sm", className: "h-10 rounded-xl border-white/[0.1] bg-white/[0.02] text-xs" })}>
                <Link2 className="mr-2 h-3.5 w-3.5" />
                Invite customers
              </Link>
              <Button
                onClick={() => void fetchOperationalData(true)}
                disabled={refreshing}
                variant="outline"
                size="sm"
                className="h-10 rounded-xl border-white/[0.1] bg-white/[0.02] text-xs"
              >
                <RefreshCw className={`mr-2 h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                onClick={handleLockCutoff}
                disabled={locking}
                size="sm"
                className="h-10 rounded-xl px-4 text-xs font-semibold"
              >
                <LockKeyhole className="mr-2 h-3.5 w-3.5" />
                {locking ? "Locking…" : "Lock cutoff"}
              </Button>
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 rounded-xl text-xs text-muted-foreground"
                  onClick={async () => {
                    await hexclaveApp.signOut();
                    window.location.href = "/login";
                  }}
                >
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  Sign out
                </Button>
              )}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[
            { label: "Meals to pack", value: String(totalDemand), detail: "confirmed + in prep", icon: ChefHat },
            { label: "Cutoff", value: batch?.cutoffTimeStr || "10:00 AM", detail: "production lock", icon: Clock3 },
            { label: "Subscribers", value: String(customers.length), detail: "active today", icon: UsersRound },
            { label: "Today's revenue", value: totalRevenuePaise ? formatINR(totalRevenuePaise as Paise) : "₹0", detail: "current production", icon: WalletCards },
          ].map(({ label, value, detail, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">{label}</span>
                <Icon className="h-4 w-4 text-subtle" />
              </div>
              <p className="mt-4 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{value}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-subtle">{detail}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[.88fr_1.12fr]">
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-subtle">Production board</p>
                <h2 className="mt-2 text-xl font-semibold">What the kitchen should pack</h2>
              </div>
              <ChefHat className="h-5 w-5 text-primary" />
            </div>

            <div className="mt-6 space-y-3">
              {Object.entries(batch?.skuBreakdown || {}).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/[0.1] p-8 text-center">
                  <p className="text-sm font-medium">No production demand yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">Confirmed recurring orders will appear here automatically.</p>
                </div>
              ) : (
                Object.entries(batch!.skuBreakdown).map(([skuId, item]) => {
                  const share = totalDemand ? Math.min((item.quantity / totalDemand) * 100, 100) : 0;
                  return (
                    <div key={skuId} className="rounded-2xl border border-white/[0.07] bg-black/10 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{item.productName}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">{formatINR(item.totalPaise as Paise)} production value</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-primary">{item.quantity}</p>
                          <p className="text-[10px] uppercase tracking-[0.12em] text-subtle">packs</p>
                        </div>
                      </div>
                      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${share}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-white/[0.07] p-3">
                <p className="text-[10px] uppercase tracking-[0.12em] text-subtle">Scheduled</p>
                <p className="mt-2 text-sm font-semibold">{batch?.totalScheduled || 0}</p>
              </div>
              <div className="rounded-xl border border-white/[0.07] p-3">
                <p className="text-[10px] uppercase tracking-[0.12em] text-subtle">Skipped</p>
                <p className="mt-2 text-sm font-semibold">{batch?.totalSkipped || 0}</p>
              </div>
              <div className="rounded-xl border border-white/[0.07] p-3">
                <p className="text-[10px] uppercase tracking-[0.12em] text-subtle">Delivered</p>
                <p className="mt-2 text-sm font-semibold">{batch?.totalDelivered || 0}</p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.025]">
            <div className="border-b border-white/[0.08] px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-subtle">Run sheet</p>
                  <h2 className="mt-2 text-xl font-semibold">Today's subscribers</h2>
                </div>
                <div className="relative w-full md:max-w-xs">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle" />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search name, flat or plan"
                    className="h-10 rounded-xl border-white/[0.1] bg-white/[0.025] pl-9 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="divide-y divide-white/[0.07]">
              {filteredCustomers.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <UsersRound className="mx-auto h-6 w-6 text-subtle" />
                  <p className="mt-3 text-sm font-medium">No matching subscribers</p>
                  <p className="mt-1 text-xs text-muted-foreground">Try a different search term.</p>
                </div>
              ) : (
                filteredCustomers.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold">{customer.name}</p>
                        <Badge variant="outline" className="rounded-full border-white/[0.1] bg-white/[0.02] text-[10px]">{customer.flat}</Badge>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{customer.plan}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-semibold text-primary">₹{customer.balance}</p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-subtle">{customer.status.replaceAll("_", " ")}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between border-t border-white/[0.08] px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold">Operational completion</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{completion}% of scheduled deliveries marked delivered.</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { title: "Service catalog", detail: "Pricing, cutoff and asset rules.", href: "/vendor/services", icon: Settings2 },
            { title: "Invite households", detail: "Create a direct society onboarding link.", href: "/vendor/onboard", icon: Link2 },
            { title: "Disputes", detail: "Review exceptions before they become support threads.", href: "/disputes", icon: ArrowUpRight },
          ].map(({ title, detail, href, icon: Icon }) => (
            <Link key={title} href={href} className="group rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 transition hover:border-white/[0.14] hover:bg-white/[0.04]">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.045] text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-subtle transition group-hover:text-primary" />
              </div>
              <h3 className="mt-5 text-sm font-semibold">{title}</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}
