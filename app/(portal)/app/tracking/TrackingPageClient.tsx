"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, MapPin, PackageCheck, RefreshCw, Truck } from "lucide-react";
import { useUser } from "@hexclave/next";
import { CUSTOMER_ROUTES } from "@/src/modules/customer-ui/routes";
import { formatINR, Paise } from "@/src/shared/types/money";

type ApiEnvelope<T> = { success?: boolean; data?: T };

async function readApiEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
  const payload: unknown = await response.json();
  return typeof payload === "object" && payload !== null ? (payload as ApiEnvelope<T>) : {};
}

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
  let user = null;
  try {
    user = useUser();
  } catch {
    user = null;
  }
  const [fulfillments, setFulfillments] = useState<Fulfillment[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestedFulfillmentId, setRequestedFulfillmentId] = useState("");

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
      if (response.ok) {
        const payload = await readApiEnvelope<Fulfillment[]>(response);
        setFulfillments(payload.success && Array.isArray(payload.data) ? payload.data : []);
      }
    } catch {
      setFulfillments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setRequestedFulfillmentId(new URLSearchParams(window.location.search).get("fulfillment") || "");
    void load();
  }, [user?.id]);

  const latest = useMemo(() => {
    if (requestedFulfillmentId) {
      return fulfillments.find((item) => item.id === requestedFulfillmentId) || fulfillments[0];
    }
    return fulfillments[0];
  }, [fulfillments, requestedFulfillmentId]);

  const activeIndex = latest ? statusIndex(String(latest.status || "SCHEDULED")) : -1;

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
          <h1 className="mt-1 text-lg font-bold font-display">Delivery Tracking</h1>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-raised text-ink-muted hover:text-ink hover:bg-surface-band shadow-xs transition-colors cursor-pointer"
          aria-label="Refresh tracking"
        >
          <RefreshCw size={17} />
        </button>
      </header>

      {loading ? (
        <div className="mt-6 animate-pulse space-y-4">
          <div className="h-32 rounded-3xl bg-surface-band" />
          <div className="h-56 rounded-3xl bg-surface-band" />
        </div>
      ) : !latest ? (
        <section className="mt-6 rounded-3xl border border-dashed border-border bg-surface-raised p-10 text-center shadow-card">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-coral/15 text-action">
            <Truck size={24} />
          </div>
          <h2 className="mt-4 text-base font-bold text-ink font-display">No active delivery right now</h2>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-ink-muted">
            Once you subscribe to milk, drinking water, or daily meals, your live fulfillment status and morning delivery progress will appear here.
          </p>
          <Link
            href={CUSTOMER_ROUTES.home}
            className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-action px-5 text-xs font-bold text-white shadow-xs hover:bg-action-hover transition-all"
          >
            Explore marketplace
          </Link>
        </section>
      ) : (
        <div className="mt-6 space-y-4">
          {/* Active Fulfillment Card */}
          <section className="rounded-3xl border border-border bg-surface-raised p-5 shadow-card sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-muted">
                  Today&apos;s Fulfillment
                </p>
                <h2 className="mt-1 text-base sm:text-lg font-bold text-ink font-display">
                  {latest.items?.[0]?.productName || "Household service"}
                </h2>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {latest.serviceDate || "Today"}{latest.shift ? ` · ${latest.shift}` : ""}
                </p>
              </div>
              <span className="rounded-full bg-coral/15 border border-coral/30 px-3 py-1 text-[11px] font-bold text-action">
                {String(latest.status || "SCHEDULED").replaceAll("_", " ")}
              </span>
            </div>
            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-surface-band border border-border p-3.5">
              <MapPin className="h-5 w-5 text-coral shrink-0" />
              <div>
                <p className="text-xs font-bold text-ink">Society Gate Destination</p>
                <p className="mt-0.5 text-[11px] text-ink-muted">
                  Gate pass pre-cleared for 7:00 AM doorstep drop.
                </p>
              </div>
            </div>
          </section>

          {/* Stepper Progress */}
          <section className="rounded-3xl border border-border bg-surface-raised p-5 shadow-card sm:p-6">
            <h3 className="text-sm font-bold text-ink font-display">Delivery Timeline</h3>
            <div className="mt-5 space-y-4">
              {STATUS_STEPS.map((step, index) => {
                const complete = activeIndex >= index;
                const Icon = step.icon;
                return (
                  <div key={step.id} className="flex items-center gap-3.5">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${
                        complete
                          ? "bg-[#2E7D32] text-white font-bold shadow-xs"
                          : "bg-surface-band text-ink-muted"
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-xs font-bold ${
                          complete ? "text-ink" : "text-ink-muted"
                        }`}
                      >
                        {step.title}
                      </p>
                      {latest.cutoffTime && index === 0 && (
                        <p className="mt-0.5 text-[10px] text-ink-muted">
                          Cutoff {latest.cutoffTime}
                        </p>
                      )}
                    </div>
                    {complete && <CheckCircle2 size={16} className="text-[#2E7D32]" />}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Total & Notes Card */}
          <section className="rounded-3xl border border-border bg-surface-raised p-5 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-ink">Fulfillment Total</p>
                <p className="mt-0.5 text-[11px] text-ink-muted">
                  {latest.notes || "Recorded on digital khata."}
                </p>
              </div>
              <p className="text-base font-extrabold text-action">
                {formatINR(Number(latest.totalPricePaise || 0) as Paise)}
              </p>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
