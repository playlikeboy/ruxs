"use client";

import React from "react";
import { MapPin, Navigation, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { useCustomerUI } from "../context/CustomerUIContext";
import { DSBottomSheet, DSButton } from "@/src/design-system";

export function GeofenceModal() {
  const {
    isGeofenceModalOpen,
    setIsGeofenceModalOpen,
    currentGeofence,
    geofenceList,
    selectGeofence,
  } = useCustomerUI();

  return (
    <DSBottomSheet
      isOpen={isGeofenceModalOpen}
      onClose={() => setIsGeofenceModalOpen(false)}
      title="Society Geofence & Location"
      subtitle="Select or simulate your apartment society geofence"
      maxWidth="max-w-md"
    >
      <div className="space-y-4 pb-4">
        {/* Radar Status Card */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.08] p-4 text-center">
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-black shadow">
              <Navigation size={22} className="stroke-[2.5]" />
            </div>
          </div>
          <h3 className="mt-3 text-sm font-bold text-foreground">
            {currentGeofence.isInside
              ? "Inside Active Society Geofence"
              : "Outside Society Boundary"}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {currentGeofence.deliveryGuarantee}
          </p>
        </div>

        {/* Society List */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Available Society Clusters
          </label>
          {geofenceList.map((geo) => {
            const isSelected = geo.id === currentGeofence.id;
            return (
              <button
                key={geo.id}
                type="button"
                onClick={() => {
                  selectGeofence(geo.id);
                  setIsGeofenceModalOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-2xl border p-3.5 text-left transition-all ${
                  isSelected
                    ? "border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_16px_rgba(16,185,129,0.15)]"
                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      geo.isInside ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                    }`}
                  >
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{geo.societyName}</h4>
                    <p className="text-[10px] text-muted-foreground">
                      Radius: {geo.radiusMeters}m · GPS: {geo.distanceMeters}m away
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      geo.isInside
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    {geo.isInside ? "Inside" : "Edge"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </DSBottomSheet>
  );
}
