"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, FileText, RefreshCw, ShieldCheck } from "lucide-react";
import { useUser } from "@hexclave/next";
import { CUSTOMER_ROUTES } from "@/src/modules/customer-ui/routes";
import { formatINR, Paise } from "@/src/shared/types/money";

type Subscription = {
  id: string;
  tenantId: string;
  productName?: string;
  vendorName?: string;
  businessName?: string;
  defaultQuantity?: number;
  quantity?: number;
  unitPricePaise?: number;
  cadence?: string;
  shift?: string;
  status?: string;
};

type Khata = {
  tenantId?: string;
  runningBalancePaise?: number;
  entries?: Array<{
    id: string;
    entryType: string;
    direction: "DEBIT" | "CREDIT";
    amountPaise: number;
    runningBalancePaise: number;
    description: string;
    createdAt: string;
  }>;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  totalAmountDuePaise: number;
  amountPaidPaise: number;
  status: string;
};

type ApiEnvelope<T> = { success?: boolean; data?: T };

async function json<T>(url: string): Promise<T | null> {
  const response = await fetch(url, { cache: "no-store" });
  const payload: unknown = await response.json();
  if (typeof payload !== "object" || payload === null) return null;
  const envelope = payload as ApiEnvelope<T>;
  return envelope.success ? envelope.data ?? null : null;
}

export default function KhataPageClient() {
  let user = null;
  try {
    user = useUser();
  } catch {
    user = null;
  }
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [khata, setKhata] = useState<Khata | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantFromUrl, setTenantFromUrl] = useState("");

  const load = async () => {
    if (!user?.id) {
      setSubscriptions([]);
      setKhata(null);
      setInvoices([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [subsPayload, invsPayload] = await Promise.all([
        json<Subscription[]>(`/api/subscriptions?customerId=${encodeURIComponent(user.id)}`),
        json<Invoice[]>(`/api/billing/invoices?customerId=${encodeURIComponent(user.id)}`),
      ]);
      const nextSubs = subsPayload || [];
      setSubscriptions(nextSubs);
      setInvoices(invsPayload || []);

      const tenantId = tenantFromUrl || nextSubs[0]?.tenantId || "";
      if (tenantId) {
        const statement = await json<Khata>(
          `/api/khata?tenantId=${encodeURIComponent(tenantId)}&customerId=${encodeURIComponent(user.id)}`
        );
        setKhata(statement);
      } else {
        setKhata(null);
      }
    } catch {
      setSubscriptions([]);
      setKhata(null);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTenantFromUrl(new URLSearchParams(window.location.search).get("tenant") || "");
  }, []);

  useEffect(() => {
    void load();
  }, [user?.id, tenantFromUrl]);

  const balance = Number(khata?.runningBalancePaise || 0);
  const outstanding = useMemo(
    () =>
      invoices.reduce(
        (sum, invoice) =>
          sum +
          Math.max(
            Number(invoice.totalAmountDuePaise || 0) - Number(invoice.amountPaidPaise || 0),
            0
          ),
        0
      ),
    [invoices]
  );

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-28 pt-5 text-ink font-sans">
      <header className="flex items-center justify-between">
        <Link
          href={CUSTOMER_ROUTES.home}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-raised text-ink shadow-xs hover:bg-surface-band transition-colors cursor-pointer"
          aria-label="Back to home"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-coral">
            Customer App
          </p>
          <h1 className="mt-1 text-lg font-bold font-display">Digital Khata</h1>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-raised text-ink-muted hover:text-ink hover:bg-surface-band shadow-xs transition-colors cursor-pointer"
          aria-label="Refresh khata"
        >
          <RefreshCw size={17} />
        </button>
      </header>

      {loading ? (
        <div className="mt-6 animate-pulse space-y-4">
          <div className="h-32 rounded-3xl bg-surface-band" />
          <div className="h-48 rounded-3xl bg-surface-band" />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {/* Main Balance Card */}
          <section className="rounded-3xl border border-border bg-surface-raised p-5 shadow-card sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-muted">
                  Running Ledger Balance
                </p>
                <h2 className="mt-1.5 text-3xl font-black text-ink font-display">
                  {formatINR(balance as Paise)}
                </h2>
                <p className="mt-1 text-xs text-ink-muted">
                  {balance > 0
                    ? "Amount due in active vendor account."
                    : "Zero outstanding ledger balance."}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-coral/15 border border-coral/30 text-action">
                <ShieldCheck size={22} />
              </div>
            </div>

            {/* Metric Pills */}
            <div className="mt-5 grid grid-cols-3 gap-2.5">
              <div className="rounded-2xl bg-surface-band border border-border p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-ink-muted font-bold">Routines</p>
                <p className="mt-1 text-base font-extrabold text-ink">
                  {subscriptions.filter((s) => s.status === "ACTIVE").length}
                </p>
              </div>
              <div className="rounded-2xl bg-surface-band border border-border p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-ink-muted font-bold">Invoiced</p>
                <p className="mt-1 text-base font-extrabold text-ink">
                  {formatINR(outstanding as Paise)}
                </p>
              </div>
              <div className="rounded-2xl bg-surface-band border border-border p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-ink-muted font-bold">Entries</p>
                <p className="mt-1 text-base font-extrabold text-ink">
                  {khata?.entries?.length || 0}
                </p>
              </div>
            </div>
          </section>

          {/* Active Household Services */}
          <section className="rounded-3xl border border-border bg-surface-raised p-5 shadow-card sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-ink font-display">Active Subscriptions</h2>
              <Link
                href={CUSTOMER_ROUTES.services}
                className="text-xs font-bold text-action hover:underline"
              >
                Add service
              </Link>
            </div>
            {subscriptions.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-border p-6 text-center text-xs text-ink-muted bg-surface-band">
                No recurring services are currently linked. Start an autopilot routine from the Discover tab.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-border">
                {subscriptions.map((subscription) => (
                  <div key={subscription.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-coral/10 text-action">
                        <Building2 size={17} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-ink">
                          {subscription.productName || "Recurring service"}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-ink-muted">
                          {subscription.vendorName || subscription.businessName || "Merchant"} · {subscription.cadence || "DAILY"}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-ink">
                      {formatINR(Number(subscription.unitPricePaise || 0) as Paise)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Invoices */}
          <section className="rounded-3xl border border-border bg-surface-raised p-5 shadow-card sm:p-6">
            <div className="flex items-center gap-2">
              <FileText size={17} className="text-action" />
              <h2 className="text-sm font-bold text-ink font-display">Monthly Invoices</h2>
            </div>
            {invoices.length === 0 ? (
              <p className="mt-4 text-xs text-ink-muted">
                Invoices generate automatically on the 1st of each calendar month.
              </p>
            ) : (
              <div className="mt-4 space-y-2.5">
                {invoices.map((invoice) => {
                  const due = Math.max(
                    Number(invoice.totalAmountDuePaise || 0) - Number(invoice.amountPaidPaise || 0),
                    0
                  );
                  return (
                    <div
                      key={invoice.id}
                      className="rounded-2xl border border-border bg-surface-band p-3.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-ink">{invoice.invoiceNumber}</p>
                          <p className="mt-0.5 text-[11px] text-ink-muted">
                            Due {invoice.dueDate} · {invoice.periodStart} – {invoice.periodEnd}
                          </p>
                        </div>
                        <span className="rounded-full bg-surface-raised border border-border px-2.5 py-0.5 text-[10px] font-bold text-ink">
                          {invoice.status}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-ink-muted">Outstanding</span>
                        <span className="font-extrabold text-action">{formatINR(due as Paise)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Ledger Activity */}
          {khata?.entries?.length ? (
            <section className="rounded-3xl border border-border bg-surface-raised p-5 shadow-card sm:p-6">
              <h2 className="text-sm font-bold text-ink font-display">Recent Ledger Activity</h2>
              <div className="mt-4 divide-y divide-border">
                {khata.entries.slice(0, 10).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-ink">
                        {entry.description}
                      </p>
                      <p className="mt-0.5 text-[10px] text-ink-muted">
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleString("en-IN") : entry.entryType}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-bold ${
                        entry.direction === "CREDIT" ? "text-[#2E7D32]" : "text-action"
                      }`}
                    >
                      {entry.direction === "CREDIT" ? "-" : "+"}
                      {formatINR(Number(entry.amountPaise || 0) as Paise)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </main>
  );
}
