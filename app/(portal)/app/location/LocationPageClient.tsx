"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, MapPin, Navigation } from "lucide-react";
import { useCustomerUI } from "@/src/modules/customer-ui";
import { CUSTOMER_ROUTES } from "@/src/modules/customer-ui/routes";

export default function LocationPageClient() {
  const { currentGeofence, geofenceList } = useCustomerUI();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-5 text-gray-900 sm:px-6">
      <header className="flex items-center justify-between">
        <Link href={CUSTOMER_ROUTES.home} className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm" aria-label="Back">
          <ArrowLeft size={18} />
        </Link>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Customer app</p>
          <h1 className="mt-1 text-xl font-bold">Delivery location</h1>
        </div>
        <MapPin size={18} className="text-red-500" />
      </header>

      <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <Navigation size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Account location</p>
            <h2 className="mt-1 text-lg font-bold">{currentGeofence.societyName}</h2>
            <p className="mt-1 text-xs text-gray-500">{currentGeofence.city || "City not set"}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className={currentGeofence.isInside ? "text-emerald-500" : "text-gray-400"} />
            <p className="text-xs font-semibold text-gray-900">
              {currentGeofence.isInside ? "Delivery location linked" : "Delivery location needs setup"}
            </p>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-gray-500">{currentGeofence.deliveryGuarantee}</p>
        </div>

        <Link
          href="/customer/household"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-full border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-800 hover:bg-gray-50"
        >
          Manage household address
        </Link>
      </section>

      <section className="mt-5 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold">Available delivery locations</h2>
        <div className="mt-4 space-y-2">
          {geofenceList.map((geo) => (
            <div key={geo.id} className="flex items-center justify-between rounded-2xl bg-gray-50 p-3.5">
              <div>
                <p className="text-xs font-semibold text-gray-900">{geo.societyName}</p>
                <p className="mt-1 text-[10px] text-gray-500">{geo.city || "Location"}</p>
              </div>
              {geo.id === currentGeofence.id && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-600">Selected</span>}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
