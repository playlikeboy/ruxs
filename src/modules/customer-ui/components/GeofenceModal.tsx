"use client";

import React from "react";
import { MapPin, Navigation, CheckCircle2 } from "lucide-react";
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
      title="Society Hub & Cluster"
      subtitle="Select your gated apartment society"
      maxWidth="max-w-md"
    >
      <div className="space-y-4 pb-4 text-ink font-sans">
        {/* Status Card */}
        <div className="rounded-2xl border border-coral/30 bg-coral/10 p-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-action text-white shadow-xs">
            <Navigation size={22} className="stroke-[2.5]" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-ink font-display">
            {currentGeofence.isInside
              ? "Inside Active Society Geofence"
              : "Pre-cleared Society Hub"}
          </h3>
          <p className="mt-1 text-xs text-ink-muted">
            {currentGeofence.deliveryGuarantee}
          </p>
        </div>

        {/* Society List */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
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
                className={`flex w-full items-center justify-between rounded-2xl border p-3.5 text-left select-none transition-all cursor-pointer ${
                  isSelected
                    ? "border-action bg-coral/10 shadow-xs"
                    : "border-border bg-surface-raised hover:border-border-strong hover:bg-surface-band"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      isSelected
                        ? "bg-action text-white font-bold"
                        : "bg-surface-band text-ink-muted"
                    }`}
                  >
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p
                      className={`text-xs font-bold ${
                        isSelected ? "text-action" : "text-ink"
                      }`}
                    >
                      {geo.societyName}
                    </p>
                    <p className="text-[11px] text-ink-muted">
                      Gate Pass: Pre-cleared · 6–8 AM Doorstep
                    </p>
                  </div>
                </div>

                {isSelected ? (
                  <CheckCircle2 size={18} className="text-[#2E7D32] shrink-0" />
                ) : (
                  <span className="text-xs font-bold text-ink-muted">Select</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        <DSButton
          variant="primary"
          fullWidth
          onClick={() => setIsGeofenceModalOpen(false)}
        >
          Confirm Location
        </DSButton>
      </div>
    </DSBottomSheet>
  );
}
