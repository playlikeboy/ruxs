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
      title="Society Geofence & Location"
      subtitle="Select your gated apartment society"
      maxWidth="max-w-md"
    >
      <div className="space-y-4 pb-4 text-gray-900 font-sans">
        {/* Status Card */}
        <div className="rounded-2xl border border-red-100 bg-red-50/50 p-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white shadow-xs">
            <Navigation size={22} className="stroke-[2.5]" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-gray-950">
            {currentGeofence.isInside
              ? "Inside Active Society Geofence"
              : "Outside Society Boundary"}
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            {currentGeofence.deliveryGuarantee}
          </p>
        </div>

        {/* Society List */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
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
                className={`flex w-full items-center justify-between rounded-2xl border p-3.5 text-left select-none ${
                  isSelected
                    ? "border-red-300 bg-red-50/60 shadow-xs"
                    : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      isSelected
                        ? "bg-red-500 text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p
                      className={`text-xs font-bold ${
                        isSelected ? "text-red-600" : "text-gray-900"
                      }`}
                    >
                      {geo.societyName}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Radius: {geo.radiusMeters}m · Gate Pass: Pre-cleared
                    </p>
                  </div>
                </div>

                {isSelected ? (
                  <CheckCircle2 size={18} className="text-red-500 shrink-0" />
                ) : (
                  <span className="text-xs font-medium text-gray-400">Select</span>
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
