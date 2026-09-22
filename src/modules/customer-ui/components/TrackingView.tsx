"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Clock,
  Bike,
  Star,
  MapPin,
  SlidersHorizontal,
  Search,
} from "lucide-react";
import { useCustomerUI } from "../context/CustomerUIContext";
import { MOCK_TRACKING_ORDER, MOCK_VENDORS } from "../mock-data";
import { DSTimelineStepper } from "@/src/design-system";

export function TrackingView() {
  const { setActiveTab, currentGeofence } = useCustomerUI();
  const order = MOCK_TRACKING_ORDER;

  const [callAlert, setCallAlert] = useState<string | null>(null);

  const handleCall = () => {
    setCallAlert(`Calling courier ${order.driver.name} at ${order.driver.phone}...`);
    setTimeout(() => setCallAlert(null), 3500);
  };

  const handleMessage = () => {
    setCallAlert(`Opening encrypted chat with ${order.driver.name}...`);
    setTimeout(() => setCallAlert(null), 3500);
  };

  return (
    <div className="space-y-5 pb-24 text-gray-900 font-sans">
      {/* =====================================================================
          1. TOP HEADER (Screen 2: Map & Search View)
         ===================================================================== */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => setActiveTab("home")}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-xs"
          aria-label="Back to Home"
        >
          <ArrowLeft size={18} />
        </button>

        <h1 className="text-base font-bold tracking-tight text-gray-950">
          Live Tracking & Map
        </h1>

        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-red-500 shadow-xs">
          <MapPin size={18} className="fill-red-500" />
        </div>
      </div>

      {callAlert && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 text-center">
          {callAlert}
        </div>
      )}

      {/* =====================================================================
          2. MAP SIMULATION WITH BIG RED 3D PIN (Screen 2)
         ===================================================================== */}
      <div className="relative h-72 sm:h-80 w-full rounded-3xl overflow-hidden border border-gray-200 bg-gradient-to-br from-emerald-50 via-sky-50 to-orange-50 shadow-sm">
        {/* Floating Top Search Bar with Coral Filter Circle (Screen 2) */}
        <div className="absolute top-3.5 left-3.5 right-3.5 z-20 flex items-center gap-2 rounded-full border border-gray-200/80 bg-white/95 px-3 py-1.5 shadow-sm backdrop-blur-md">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Restaurant name or Dish..."
            className="w-full bg-transparent text-xs text-gray-900 placeholder:text-gray-400 outline-none"
          />
          <div className="h-7 w-7 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <SlidersHorizontal size={13} />
          </div>
        </div>

        {/* Isometric Road Map Grid */}
        <svg
          className="absolute inset-0 h-full w-full opacity-40"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="lightGrid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path
                d="M 48 0 L 0 0 0 48"
                fill="none"
                stroke="rgba(0, 0, 0, 0.08)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#lightGrid)" />

          {/* Road outlines */}
          <path
            d="M 40 80 Q 140 60 210 140 T 360 180"
            fill="none"
            stroke="rgba(255, 255, 255, 0.9)"
            strokeWidth="18"
            strokeLinecap="round"
          />
          <path
            d="M 40 80 Q 140 60 210 140 T 360 180"
            fill="none"
            stroke="#EF4444"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="6 4"
          />
        </svg>

        {/* Giant Red 3D Location Marker in Center (Screen 2) */}
        <div className="absolute top-[52%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
          <div className="relative flex items-center justify-center">
            {/* 3D Pin Head */}
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-red-500 to-red-600 text-white shadow-xl shadow-red-500/40 border-2 border-white">
              <div className="h-5 w-5 rounded-full bg-white shadow-inner" />
            </div>
            {/* Pin pointer tip */}
            <div className="absolute -bottom-2 h-4 w-4 rotate-45 bg-red-600 border-r-2 border-b-2 border-white -z-10" />
          </div>
          {/* Shadow beneath marker */}
          <div className="mt-1 h-3 w-10 rounded-full bg-black/20 blur-xs" />
        </div>

        {/* Courier Moving Bike Pin */}
        <div className="absolute top-[35%] left-[25%] z-10">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-900 border border-gray-200 shadow-sm">
            <Bike size={16} className="text-red-500 stroke-[2.5]" />
          </div>
        </div>

        {/* Society Geofence Badge */}
        <div className="absolute bottom-3 left-3 z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-md px-3 py-1 text-[10px] font-semibold text-gray-700 border border-gray-200 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {currentGeofence.societyName.split(",")[0]}
          </span>
        </div>
      </div>

      {/* =====================================================================
          3. BOTTOM SHEET "LIST OF RESTAURANTS" (Screen 2)
         ===================================================================== */}
      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
        {/* Grab Handle pill */}
        <div className="flex justify-center -mt-1 mb-2">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-950">
            List of restaurants
          </h2>
          <span className="text-xs font-semibold text-gray-400">
            {MOCK_VENDORS.length} open near you
          </span>
        </div>

        {/* List items exactly matching Screen 2 */}
        <div className="divide-y divide-gray-100">
          {MOCK_VENDORS.map((v) => (
            <div key={v.id} className="flex items-center justify-between py-3.5 first:pt-1">
              <div className="flex items-center gap-3.5 min-w-0">
                <img
                  src={v.image}
                  alt={v.name}
                  className="h-14 w-14 rounded-2xl object-cover shrink-0 border border-gray-100"
                />
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 truncate">
                    {v.name}
                  </h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                    <MapPin size={11} className="text-red-500 shrink-0" />
                    <span className="truncate">{v.address.split(",")[0]}</span>
                  </p>
                </div>
              </div>

              {/* Star Rating on right matching Screen 2 */}
              <div className="flex items-center gap-1 text-xs font-bold text-gray-900 shrink-0 pl-2">
                <Star size={13} className="fill-amber-400 text-amber-400" />
                <span>{v.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =====================================================================
          4. DRIVER DETAILS & LIVE ORDER STEPS
         ===================================================================== */}
      <div className="flex items-center justify-between rounded-3xl border border-gray-100 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <img
            src={order.driver.photo}
            alt={order.driver.name}
            className="h-12 w-12 rounded-full object-cover border border-gray-200"
          />
          <div>
            <h3 className="text-sm font-bold text-gray-900">{order.driver.name}</h3>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 font-medium">
              <span>Verified Courier</span>
              <span>·</span>
              <span className="text-amber-500 font-bold">★ {order.driver.rating}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleMessage}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 shadow-xs"
            aria-label="Message"
          >
            <MessageCircle size={16} />
          </button>
          <button
            type="button"
            onClick={handleCall}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-white shadow-xs hover:bg-red-600"
            aria-label="Call"
          >
            <Phone size={16} />
          </button>
        </div>
      </div>

      {/* Timeline Steps */}
      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
          Order Status
        </h3>
        <DSTimelineStepper steps={order.steps} />
      </div>
    </div>
  );
}
