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

async function json<T>(url: string): Promise<T | null> {
  const response = await fetch(url, { cache: "no-store" });
  const payload = await response.json();
  return payload?.success ? payload.data : null;
}

export default function KhataPageClient() {
  const user = useUser();
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
      const [subs, invs] = await Promise.all([
        json<Subscription[]>(`/api/subscriptions?customerId=${encodeURIComponent(user.id)}`),
        json<Invoice[]>(`/api/billing/invoices?customerId=${encodeURIComponent(user.id)}`),
      ]);

      const nextSubs = Array.isArray(subs) ? subs : [];
      const nextInvoices = Array.isArray(invs) ? invs : [];
      setSubscriptions(nextSubs);
      setInvoices(nextInvoices);

      const tenantId = tenantFromUrl || nextSubs[0]?.tenantId;
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
        (sum, invoice) => sum + Math.max(Number(invoice.totalAmountDuePaise || 0) - Number(invoice.amountPaidPaise || 0), 0),
        0
      ),
    [invoices]
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 text-gray-900 sm:px-6">
      <header className="flex items-center justify-between">
        <Link
          href={CUSTOMER_ROUTES.home}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm"
          aria-label="Back to home"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Customer app</p>
          <h1 className="mt-1 text-xl font-bold">Digital Khata</h1>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm"
          aria-label="Refresh khata"
        >
          <RefreshCw size={17} />
        </button>
      </header>

      {loading ? (
        <div className="mt-8 animate-pulse space-y-4">
          <div className="h-32 rounded-3xl bg-gray-100" />
          <div className="h-48 rounded-3xl bg-gray-100" />
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Current balance</p>
                <h2 className="mt-2 text-3xl font-extrabold text-gray-950">
                  {formatINR(balance as Paise)}
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  {balance > 0 ? "Amount currently due in the selected ledger." : "No outstanding ledger balance."}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                <ShieldCheck size={20} />
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Active routines</p>
                <p className="mt-1 text-lg font-bold">{subscriptions.filter((s) => s.status === "ACTIVE").length}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Invoice outstanding</p>
                <p className="mt-1 text-lg font-bold">{formatINR(outstanding as Paise)}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Ledger entries</p>
                <p className="mt-1 text-lg font-bold">{khata?.entries?.length || 0}</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">Active household services</h2>
              <Link href={CUSTOMER_ROUTES.services} className="text-xs font-semibold text-red-500">Add service</Link>
            </div>
            {subscriptions.length === 0 ? (
              <p className="mt-6 rounded-2xl border border-dashed border-gray-200 p-7 text-center text-xs text-gray-500">
                No recurring services are linked to this account yet.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-gray-100">
                {subscriptions.map((subscription) => (
                  <div key={subscription.id} className="flex items-center justify-between gap-4 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50">
                        <Building2 size={17} className="text-red-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-gray-900">
                          {subscription.productName || "Recurring service"}
                        </p>
                        <p className="mt-1 truncate text-[11px] text-gray-500">
                          {subscription.vendorName || subscription.businessName || "Local merchant"} · {subscription.cadence || "DAILY"} · {subscription.shift || "Scheduled"}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-gray-900">
                      {formatINR(Number(subscription.unitPricePaise || 0) as Paise)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-2">
              <FileText size={17} className="text-red-500" />
              <h2 className="text-sm font-bold">Invoices</h2>
            </div>
            {invoices.length === 0 ? (
              <p className="mt-6 text-xs text-gray-500">No invoices are available for this account.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {invoices.map((invoice) => {
                  const due = Math.max(Number(invoice.totalAmountDuePaise || 0) - Number(invoice.amountPaidPaise || 0), 0);
                  return (
                    <div key={invoice.id} className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-gray-900">{invoice.invoiceNumber}</p>
                          <p className="mt-1 text-[11px] text-gray-500">
                            {invoice.periodStart} – {invoice.periodEnd} · Due {invoice.dueDate}
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-gray-600 ring-1 ring-gray-200">
                          {invoice.status}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-gray-500">Outstanding</span>
                        <span className="font-extrabold text-gray-950">{formatINR(due as Paise)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {khata?.entries?.length ? (
            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
              <h2 className="text-sm font-bold">Recent ledger activity</h2>
              <div className="mt-4 divide-y divide-gray-100">
                {khata.entries.slice(0, 12).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-gray-900">{entry.description}</p>
                      <p className="mt-1 text-[10px] text-gray-400">
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleString("en-IN") : entry.entryType}
                      </p>
                    </div>
                    <span className={`shrink-0 text-xs font-bold ${entry.direction === "CREDIT" ? "text-emerald-600" : "text-gray-900"}`}>
                      {entry.direction === "CREDIT" ? "-" : "+"}{formatINR(Number(entry.amountPaise || 0) as Paise)}
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
