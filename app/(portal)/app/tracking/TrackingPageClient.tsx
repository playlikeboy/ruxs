"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, MapPin, PackageCheck, RefreshCw, Truck } from "lucide-react";
import { useUser } from "@hexclave/next";
import { CUSTOMER_ROUTES } from "@/src/modules/customer-ui/routes";
import { formatINR, Paise } from "@/src/shared/types/money";

type Fulfillment = {
  id: string;
  serviceDate?: string;
  status?: string;
  shift?: string;
  totalPricePaise?: number;
  cutoffTime?: string;
  notes?: string;
  items?: Array<{ productName?: string; quantity?: number; unitPricePaise?: number }>;
};

const STATUS_STEPS = [
  { id: "SCHEDULED", title: "Scheduled", icon: Clock3 },
  { id: "CONFIRMED", title: "Confirmed", icon: CheckCircle2 },
  { id: "OUT_FOR_DELIVERY", title: "Out for delivery", icon: Truck },
  { id: "DELIVERED", title: "Delivered", icon: PackageCheck },
];

function statusIndex(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === "SKIPPED" || normalized === "FAILED") return -1;
  const index = STATUS_STEPS.findIndex((step) => step.id === normalized);
  if (index >= 0) return index;
  if (normalized === "PENDING") return 0;
  return 0;
}

export default function TrackingPageClient() {
  const user = useUser();
  const [fulfillments, setFulfillments] = useState<Fulfillment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user?.id) {
      setFulfillments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/fulfillments?customerId=${encodeURIComponent(user.id)}`, {
        cache: "no-store",
      });
      const payload = await response.json();
      setFulfillments(payload?.success && Array.isArray(payload.data) ? payload.data : []);
    } catch {
      setFulfillments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [user?.id]);

  const latest = useMemo(() => {
    const requestedId = new URLSearchParams(window.location.search).get("fulfillment");
    if (requestedId) {
      return fulfillments.find((item) => item.id === requestedId) || fulfillments[0];
    }
    return fulfillments[0];
  }, [fulfillments]);

  const activeIndex = latest ? statusIndex(String(latest.status || "SCHEDULED")) : -1;

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
          <h1 className="mt-1 text-xl font-bold">Delivery tracking</h1>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm"
          aria-label="Refresh tracking"
        >
          <RefreshCw size={17} />
        </button>
      </header>

      {loading ? (
        <div className="mt-8 animate-pulse space-y-4">
          <div className="h-32 rounded-3xl bg-gray-100" />
          <div className="h-56 rounded-3xl bg-gray-100" />
        </div>
      ) : !latest ? (
        <section className="mt-8 rounded-3xl border border-dashed border-gray-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <Truck size={22} />
          </div>
          <h2 className="mt-4 text-base font-bold">No delivery is active yet.</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
            Once you have a scheduled household fulfillment, its live state will appear here.
          </p>
          <Link
            href={CUSTOMER_ROUTES.services}
            className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-red-500 px-5 text-xs font-semibold text-white"
          >
            Browse services
          </Link>
        </section>
      ) : (
        <div className="mt-8 space-y-5">
          <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Fulfillment</p>
                <h2 className="mt-1 text-lg font-bold text-gray-950">
                  {latest.items?.[0]?.productName || "Household service"}
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  {latest.serviceDate || "Today"}{latest.shift ? ` · ${latest.shift}` : ""}
                </p>
              </div>
              <span className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-bold text-red-600">
                {String(latest.status || "SCHEDULED").replaceAll("_", " ")}
              </span>
            </div>
            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-gray-50 p-4">
              <MapPin className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-xs font-semibold text-gray-900">Household destination</p>
                <p className="mt-0.5 text-[11px] text-gray-500">Delivery instructions are taken from the active routine.</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
            <h3 className="text-sm font-bold text-gray-950">Progress</h3>
            <div className="mt-6 space-y-5">
              {STATUS_STEPS.map((step, index) => {
                const complete = activeIndex >= index;
                const Icon = step.icon;
                return (
                  <div key={step.id} className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full ${complete ? "bg-red-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-xs font-bold ${complete ? "text-gray-950" : "text-gray-400"}`}>{step.title}</p>
                      {latest.cutoffTime && index === 0 && (
                        <p className="mt-0.5 text-[10px] text-gray-400">Cutoff {latest.cutoffTime}</p>
                      )}
                    </div>
                    {complete && <CheckCircle2 size={15} className="text-emerald-500" />}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-950">Fulfillment total</p>
                <p className="mt-1 text-[11px] text-gray-500">{latest.notes || "No extra delivery notes."}</p>
              </div>
              <p className="text-base font-extrabold text-gray-950">
                {formatINR(Number(latest.totalPricePaise || 0) as Paise)}
              </p>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
