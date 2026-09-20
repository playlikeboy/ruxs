"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useHexclaveApp, useUser } from "@hexclave/next";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CreditCard,
  LogOut,
  Pause,
  Play,
  ReceiptText,
  Sparkles,
  Utensils,
  WalletCards,
  X,
} from "@/components/icons/animated";
import { formatINR, Paise } from "@/src/shared/types/money";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { RuxsDashboardSkeleton } from "@/components/ui/LoadingState";

interface FulfillmentItem {
  id: string;
  subscriptionId: string;
  serviceId: string;
  serviceDate: string;
  quantity: number;
  unitPricePaise: number;
  totalPricePaise: number;
  status: string;
  cutoffTime?: string;
  notes?: string;
}

interface SubscriptionItem {
  id: string;
  serviceId: string;
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
  quantity: number;
  unitPricePaise: number;
  cadence: string;
  startDate: string;
}

interface KhataStatement {
  tenantId: string;
  customerId: string;
  runningBalancePaise: number;
  entries: Array<{
    id: string;
    entryType: string;
    direction: "DEBIT" | "CREDIT";
    amountPaise: number;
    runningBalancePaise: number;
    description: string;
    createdAt: string;
  }>;
}

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  billingMonth: string;
  totalAmountPaise: number;
  paidAmountPaise: number;
  status: "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";
  dueDate: string;
}

const tenantId = "ten_sharma_tiffin";

export default function CustomerDashboardClient() {
  const user = useUser();
  const hexclaveApp = useHexclaveApp();
  const customerId = user?.id || "";

  const [loading, setLoading] = useState(true);
  const [todayFulfillment, setTodayFulfillment] = useState<FulfillmentItem | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [khataStatement, setKhataStatement] = useState<KhataStatement>({
    tenantId,
    customerId: user?.id || "",
    runningBalancePaise: 0,
    entries: [],
  });
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [upiModal, setUpiModal] = useState({
    open: false,
    intentUri: "",
    amountPaise: 0,
  });

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [fulRes, subRes, khataRes, invRes] = await Promise.all([
        fetch(`/api/fulfillments?customerId=${user.id}`),
        fetch(`/api/subscriptions?customerId=${user.id}`),
        fetch(`/api/khata?tenantId=${tenantId}&customerId=${user.id}`),
        fetch(`/api/billing/invoices?customerId=${user.id}`),
      ]);

      const fulData = (await fulRes.json()) as { success: boolean; data?: any[] };
      if (fulData.success && Array.isArray(fulData.data) && fulData.data.length > 0) {
        const todayStr = new Date().toISOString().split("T")[0];
        const match = fulData.data.find((f) => f.serviceDate === todayStr) || fulData.data[0];
        setTodayFulfillment({
          id: match.id,
          subscriptionId: match.subscriptionId,
          serviceId: match.items?.[0]?.productName || "Standard Lunch Service",
          serviceDate: match.serviceDate,
          quantity: match.items?.[0]?.quantity || 1,
          unitPricePaise: match.items?.[0]?.unitPricePaise || match.totalPricePaise,
          totalPricePaise: match.totalPricePaise,
          status: match.status,
          cutoffTime: match.cutoffTime || "10:00 AM",
          notes: match.notes,
        });
      } else {
        setTodayFulfillment(null);
      }

      const subData = (await subRes.json()) as { success: boolean; data?: any[] };
      if (subData.success && Array.isArray(subData.data)) {
        setSubscriptions(
          subData.data.map((s: any) => ({
            id: s.id,
            serviceId: s.productName || "Recurring Service",
            status: s.status,
            quantity: s.defaultQuantity || 1,
            unitPricePaise: s.unitPricePaise || 0,
            cadence: s.cadence,
            startDate: s.startDate,
          }))
        );
      } else {
        setSubscriptions([]);
      }

      const khataData = (await khataRes.json()) as { success: boolean; data?: KhataStatement };
      if (khataData.success && khataData.data) setKhataStatement(khataData.data);

      const invData = (await invRes.json()) as { success: boolean; data?: any[] };
      if (invData.success && Array.isArray(invData.data)) {
        setInvoices(
          invData.data.map((i: any) => ({
            id: i.id,
            invoiceNumber: i.invoiceNumber,
            billingMonth: (i.periodStart || "").slice(0, 7) || "2026-09",
            totalAmountPaise: i.totalAmountDuePaise || i.subtotalPaise || 0,
            paidAmountPaise: i.amountPaidPaise || 0,
            status: i.status,
            dueDate: i.dueDate,
          }))
        );
      } else {
        setInvoices([]);
      }
    } catch (error) {
      console.error("Failed to load customer portal data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      void loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-xl items-center justify-center px-6 py-12">
        <div className="w-full rounded-[28px] border border-white/[0.08] bg-white/[0.025] p-8 text-center shadow-2xl space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <CreditCard className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-primary">
              Hexclave Auth Required
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Domestic Account Portal</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sign in with your Hexclave account to access your household recurring deliveries, manage daily autopilot cutoffs, and review digital khata statements.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/login?redirect=/customer/dashboard"
              className={buttonVariants({ variant: "default", size: "lg", className: "w-full shadow-lg font-bold gap-2" })}
            >
              Sign In with Hexclave
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleTodayAction = async (action: "CONFIRM" | "SKIP") => {
    if (!todayFulfillment) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/fulfillments/${todayFulfillment.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as { success: boolean; data?: { status: string } };
      if (data.success && data.data) {
        setTodayFulfillment((prev) => (prev ? { ...prev, status: data.data!.status } : null));
      } else {
        setTodayFulfillment((prev) => prev ? { ...prev, status: action === "SKIP" ? "SKIPPED" : "CONFIRMED" } : null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSubscription = async (subscription: SubscriptionItem) => {
    const action = subscription.status === "ACTIVE" ? "pause" : "resume";
    try {
      const res = await fetch(`/api/subscriptions/${subscription.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as { success: boolean; data?: { status: SubscriptionItem["status"] } };
      setSubscriptions((current) =>
        current.map((item) =>
          item.id === subscription.id
            ? { ...item, status: data.success && data.data ? data.data.status : action === "pause" ? "PAUSED" : "ACTIVE" }
            : item
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handlePayUPI = async (amountPaise: number) => {
    if (!user) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          customerId: user.id,
          amountPaise,
          upiId: "sharmatiffin@okaxis",
          merchantName: "Sharma Tiffin Services",
        }),
      });
      const data = (await res.json()) as { success: boolean; data?: { upiIntentUri: string; amountPaise: number } };
      const amount = data.data?.amountPaise ?? amountPaise;
      const intent =
        data.data?.upiIntentUri ||
        `upi://pay?pa=sharmatiffin@okaxis&pn=Sharma+Tiffin&am=${amount / 100}&cu=INR`;
      setUpiModal({ open: true, intentUri: intent, amountPaise: amount });
    } catch {
      setUpiModal({
        open: true,
        intentUri: `upi://pay?pa=sharmatiffin@okaxis&pn=Sharma+Tiffin&am=${amountPaise / 100}&cu=INR`,
        amountPaise,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const dueAmountPaise = khataStatement.runningBalancePaise || 0;
  const activePlans = subscriptions.filter((item) => item.status === "ACTIVE").length;
  const latestInvoice = useMemo(() => invoices[0], [invoices]);
  const displayName =
    (user as any)?.name ||
    (user as any)?.displayName ||
    user?.primaryEmail ||
    (user as any)?.email ||
    "Household member";

  if (loading) {
    return (
      <div className="py-2">
        <RuxsDashboardSkeleton />
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-[1260px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="flex flex-col gap-6">
          <section className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[radial-gradient(circle_at_top_right,rgba(159,197,143,0.11),transparent_38%),rgba(16,20,18,0.76)] p-6 sm:p-8">
            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em]">
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-primary">Household</span>
                  <span className="text-subtle">{new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "short" }).format(new Date())}</span>
                </div>
                <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
                  Good day, {displayName.split(" ")[0] || "there"}.
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                  Your recurring services are organised around what happens today—not another dashboard you have to manage.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link href="/customer/subscribe" className={buttonVariants({ variant: "outline", size: "sm", className: "h-10 rounded-xl border-white/[0.1] bg-white/[0.02] px-4 text-xs" })}>
                  Add a service
                </Link>
                <Button onClick={() => handlePayUPI(dueAmountPaise || 12000)} disabled={actionLoading} size="sm" className="h-10 rounded-xl px-4 text-xs font-semibold">
                  <CreditCard className="mr-2 h-3.5 w-3.5" />
                  Pay {formatINR(dueAmountPaise as Paise)}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 rounded-xl px-3 text-xs text-muted-foreground"
                  onClick={async () => {
                    await hexclaveApp.signOut();
                    window.location.href = "/login";
                  }}
                >
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  Sign out
                </Button>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "Due on Khata", value: formatINR(dueAmountPaise as Paise), detail: "Current balance", icon: WalletCards, accent: dueAmountPaise > 0 },
              { label: "Active services", value: String(activePlans), detail: "Recurring plans", icon: Sparkles, accent: false },
              { label: "Next delivery", value: todayFulfillment?.cutoffTime || "—", detail: todayFulfillment ? "Cutoff today" : "No delivery scheduled", icon: CalendarDays, accent: false },
              { label: "Latest invoice", value: latestInvoice?.invoiceNumber || "—", detail: latestInvoice ? latestInvoice.status.toLowerCase() : "Nothing outstanding", icon: ReceiptText, accent: false },
            ].map(({ label, value, detail, icon: Icon, accent }) => (
              <div key={label} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
                  <Icon className="h-4 w-4 text-subtle" />
                </div>
                <p className={`mt-4 text-xl font-semibold tracking-tight ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-subtle">{detail}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
            <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.025]">
              <div className="border-b border-white/[0.08] px-5 py-5 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-primary">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Today
                    </div>
                    <h2 className="mt-2 text-xl font-semibold">Lunch delivery</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {todayFulfillment?.serviceId || "No active delivery scheduled for today"}
                    </p>
                  </div>
                  <Badge variant="outline" className="rounded-full border-white/[0.1] bg-white/[0.02] px-2.5 py-1 text-[10px]">
                    {todayFulfillment?.status || "NO SCHEDULE"}
                  </Badge>
                </div>
              </div>

              <div className="px-5 py-5 sm:px-6">
                {todayFulfillment ? (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-2xl border border-white/[0.07] bg-black/10 p-4">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-subtle">Quantity</p>
                        <p className="mt-2 text-lg font-semibold">{todayFulfillment.quantity}</p>
                        <p className="text-[10px] text-muted-foreground">meal</p>
                      </div>
                      <div className="rounded-2xl border border-white/[0.07] bg-black/10 p-4">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-subtle">Cutoff</p>
                        <p className="mt-2 text-lg font-semibold">{todayFulfillment.cutoffTime || "10:00 AM"}</p>
                        <p className="text-[10px] text-muted-foreground">local time</p>
                      </div>
                      <div className="rounded-2xl border border-white/[0.07] bg-black/10 p-4">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-subtle">Amount</p>
                        <p className="mt-2 text-lg font-semibold text-primary">{formatINR(todayFulfillment.totalPricePaise as Paise)}</p>
                        <p className="text-[10px] text-muted-foreground">today</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <Button
                        className="h-11 flex-1 rounded-xl text-xs font-semibold"
                        onClick={() => handleTodayAction("CONFIRM")}
                        disabled={actionLoading || todayFulfillment.status === "CONFIRMED"}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Keep today
                      </Button>
                      <Button
                        variant="outline"
                        className="h-11 flex-1 rounded-xl border-white/[0.1] text-xs"
                        onClick={() => handleTodayAction("SKIP")}
                        disabled={actionLoading || todayFulfillment.status === "SKIPPED"}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Skip today
                      </Button>
                    </div>
                    <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
                      Changes are accepted until the {todayFulfillment.cutoffTime || "10:00 AM"} cutoff.
                    </p>
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/[0.1] bg-black/10 p-8 text-center">
                    <Utensils className="mx-auto h-6 w-6 text-subtle" />
                    <p className="mt-3 text-sm font-medium">Nothing scheduled today</p>
                    <p className="mt-1 text-xs text-muted-foreground">Start a recurring service and RUXS will handle the routine from there.</p>
                    <Link href="/customer/subscribe" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-primary">
                      Add a service <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-subtle">Digital Khata</p>
                  <h2 className="mt-2 text-xl font-semibold">Your balance</h2>
                </div>
                <WalletCards className="h-5 w-5 text-primary" />
              </div>

              <div className="mt-7 rounded-2xl border border-primary/15 bg-primary/[0.045] p-5">
                <p className="text-xs text-muted-foreground">Outstanding</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-primary">{formatINR(dueAmountPaise as Paise)}</p>
                <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
                  Every fulfilled day becomes a visible line item. No paper notebook required.
                </p>
              </div>

              <div className="mt-4 space-y-2">
                {khataStatement.entries.slice(0, 3).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-black/10 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">{entry.description}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{entry.createdAt}</p>
                    </div>
                    <span className={`ml-4 shrink-0 text-xs font-semibold ${entry.direction === "CREDIT" ? "text-primary" : "text-foreground"}`}>
                      {entry.direction === "CREDIT" ? "+" : "-"}{formatINR(entry.amountPaise as Paise)}
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handlePayUPI(dueAmountPaise || 12000)}
                className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-primary transition hover:text-foreground"
              >
                Pay balance <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025]">
            <div className="flex flex-col gap-3 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-subtle">Subscriptions</p>
                <h2 className="mt-2 text-xl font-semibold">Recurring services</h2>
              </div>
              <Link href="/customer/subscribe" className="text-xs font-semibold text-primary">Add another service</Link>
            </div>

            <div className="divide-y divide-white/[0.07]">
              {subscriptions.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-sm font-medium">No recurring services yet.</p>
                  <p className="mt-1 text-xs text-muted-foreground">Set one up once and let RUXS carry it forward.</p>
                </div>
              ) : (
                subscriptions.map((subscription) => (
                  <div key={subscription.id} className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.045] text-primary">
                        <Utensils className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold">{subscription.serviceId}</p>
                          <Badge variant="outline" className="rounded-full border-white/[0.1] bg-white/[0.02] text-[10px]">
                            {subscription.status}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {subscription.cadence} · {subscription.quantity} unit · {formatINR(subscription.unitPricePaise as Paise)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 rounded-xl px-3 text-xs"
                      onClick={() => handleToggleSubscription(subscription)}
                    >
                      {subscription.status === "ACTIVE" ? <Pause className="mr-2 h-3.5 w-3.5" /> : <Play className="mr-2 h-3.5 w-3.5" />}
                      {subscription.status === "ACTIVE" ? "Pause" : "Resume"}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025]">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-5 sm:px-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-subtle">Billing</p>
                <h2 className="mt-2 text-xl font-semibold">Invoices</h2>
              </div>
              <ReceiptText className="h-5 w-5 text-subtle" />
            </div>
            <div className="divide-y divide-white/[0.07]">
              {invoices.length === 0 ? (
                <div className="px-6 py-10 text-center text-xs text-muted-foreground">No invoices generated yet.</div>
              ) : (
                invoices.map((invoice) => {
                  const outstanding = Math.max(invoice.totalAmountPaise - invoice.paidAmountPaise, 0);
                  return (
                    <div key={invoice.id} className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{invoice.invoiceNumber}</p>
                          <Badge variant="outline" className="rounded-full border-white/[0.1] bg-white/[0.02] text-[10px]">{invoice.status}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {invoice.billingMonth} · due {invoice.dueDate}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-4 sm:justify-end">
                        <div className="text-right">
                          <p className="text-sm font-semibold">{formatINR(invoice.totalAmountPaise as Paise)}</p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            {outstanding > 0 ? `${formatINR(outstanding as Paise)} outstanding` : "Settled"}
                          </p>
                        </div>
                        {outstanding > 0 && (
                          <Button size="sm" className="h-9 rounded-xl text-xs" onClick={() => handlePayUPI(outstanding)}>
                            Pay
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>

      {upiModal.open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/[0.1] bg-[#111512] p-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary">UPI payment</p>
                <h3 className="mt-2 text-lg font-semibold">Settle your balance</h3>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setUpiModal({ open: false, intentUri: "", amountPaise: 0 })}
                className="rounded-full p-2 text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/[0.045] p-5 text-center">
              <p className="text-xs text-muted-foreground">Payable</p>
              <p className="mt-2 text-3xl font-semibold text-primary">{formatINR(upiModal.amountPaise as Paise)}</p>
            </div>
            <a href={upiModal.intentUri} className="mt-5 flex h-11 w-full items-center justify-center rounded-xl bg-primary text-xs font-semibold text-primary-foreground">
              Open UPI app
            </a>
            <button
              type="button"
              onClick={() => setUpiModal({ open: false, intentUri: "", amountPaise: 0 })}
              className="mt-2 h-10 w-full rounded-xl border border-white/[0.09] text-xs text-muted-foreground hover:bg-white/[0.03] hover:text-foreground"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
