"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, MapPin, Navigation, Check } from "lucide-react";
import { useCustomerUI } from "@/src/modules/customer-ui";
import { CUSTOMER_ROUTES } from "@/src/modules/customer-ui/routes";

export default function LocationPageClient() {
  const { currentGeofence, geofenceList, selectGeofence } = useCustomerUI();

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-28 pt-5 text-ink font-sans">
      <header className="flex items-center justify-between">
        <Link
          href={CUSTOMER_ROUTES.home}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-raised text-ink shadow-xs hover:bg-surface-band transition-colors cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-coral">
            Customer App
          </p>
          <h1 className="mt-1 text-lg font-bold font-display">Delivery Location</h1>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-coral/15 text-action">
          <MapPin size={18} />
        </div>
      </header>

      {/* Current Active Location Card */}
      <section className="mt-6 rounded-3xl border border-border bg-surface-raised p-5 shadow-card sm:p-6">
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-coral/15 border border-coral/30 text-action shadow-xs">
            <Navigation size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-muted">
              Current Active Geofence
            </p>
            <h2 className="mt-1 text-base sm:text-lg font-bold text-ink font-display">
              {currentGeofence.societyName}
            </h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              {currentGeofence.city || "Bangalore"} · Direct Society Gate Entry
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-border bg-surface-band p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2
              size={16}
              className={currentGeofence.isInside ? "text-[#2E7D32]" : "text-ink-muted"}
            />
            <p className="text-xs font-bold text-ink">
              {currentGeofence.isInside ? "Pre-cleared Delivery Cluster" : "Location Needs Setup"}
            </p>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">
            {currentGeofence.deliveryGuarantee}
          </p>
        </div>

        <Link
          href="/customer/household"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-full border border-border bg-surface-band px-4 text-xs font-bold text-ink hover:bg-surface-subtle transition-colors shadow-xs"
        >
          Manage flat / household details
        </Link>
      </section>

      {/* Selectable Pre-cleared Societies */}
      <section className="mt-5 rounded-3xl border border-border bg-surface-raised p-5 shadow-card">
        <h2 className="text-sm font-bold text-ink font-display">Select Society Cluster</h2>
        <p className="mt-0.5 text-xs text-ink-muted">
          Choose your apartment complex to view pre-cleared vendors with morning gate passes.
        </p>

        <div className="mt-4 space-y-2.5">
          {geofenceList.map((geo) => {
            const isSelected = geo.id === currentGeofence.id;
            return (
              <button
                key={geo.id}
                type="button"
                onClick={() => selectGeofence(geo.id)}
                className={`flex w-full items-center justify-between rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                  isSelected
                    ? "border-action bg-coral/10 shadow-xs"
                    : "border-border bg-surface-band hover:border-border-strong hover:bg-surface-subtle"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      isSelected
                        ? "bg-action text-white font-bold"
                        : "bg-surface-raised text-ink-muted"
                    }`}
                  >
                    <MapPin size={17} />
                  </div>
                  <div>
                    <p
                      className={`text-xs font-bold ${
                        isSelected ? "text-action" : "text-ink"
                      }`}
                    >
                      {geo.societyName}
                    </p>
                    <p className="text-[10px] text-ink-muted">
                      {geo.city || "Bangalore"} · 7:00 AM Doorstep
                    </p>
                  </div>
                </div>

                {isSelected ? (
                  <span className="flex h-6 items-center gap-1 rounded-full bg-[#E8F5E9] px-2.5 text-[10px] font-bold text-[#2E7D32] border border-[#2E7D32]/20">
                    <Check size={12} className="stroke-[3]" />
                    <span>Active</span>
                  </span>
                ) : (
                  <span className="text-xs font-bold text-ink-muted hover:text-ink">
                    Switch
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
