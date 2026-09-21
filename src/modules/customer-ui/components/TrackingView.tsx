"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Clock,
  Bike,
  ShieldCheck,
  CheckCircle2,
  Navigation,
} from "lucide-react";
import { useCustomerUI } from "../context/CustomerUIContext";
import { MOCK_TRACKING_ORDER } from "../mock-data";
import { DSTimelineStepper, DSButton } from "@/src/design-system";

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
    <div className="space-y-5 pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => setActiveTab("home")}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-foreground hover:bg-white/[0.08] transition active:scale-95"
          aria-label="Back to Home"
        >
          <ArrowLeft size={18} />
        </button>

        <h1 className="text-base font-bold tracking-tight text-foreground">
          Live Tracking
        </h1>

        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-muted-foreground">
          <Navigation size={16} className="text-emerald-400" />
        </div>
      </div>

      {callAlert && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-300 text-center animate-in fade-in">
          {callAlert}
        </div>
      )}

      {/* Stylized Road Map Simulation (Screen 4) */}
      <div className="relative h-56 sm:h-64 w-full rounded-3xl overflow-hidden border border-white/[0.08] bg-[#101713]">
        {/* SVG Street Grid & Polyline */}
        <svg
          className="absolute inset-0 h-full w-full opacity-60"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Road outlines */}
          <path
            d="M 20 60 Q 120 40 200 120 T 360 160"
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Green Active Route Polyline */}
          <path
            d="M 30 70 Q 130 50 190 115 T 320 150"
            fill="none"
            stroke="#10b981"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="6 4"
            className="animate-pulse"
          />
        </svg>

        {/* Courier Moving Bike Pin */}
        <div className="absolute top-[85px] left-[175px] z-10 -translate-x-1/2 -translate-y-1/2">
          <div className="relative flex items-center justify-center">
            <span className="absolute h-12 w-12 rounded-full bg-emerald-500/20 animate-ping" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-black shadow-[0_4px_16px_rgba(16,185,129,0.6)]">
              <Bike size={20} className="stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Destination Pin (Society) */}
        <div className="absolute bottom-[40px] right-[50px] z-10">
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-white px-2 py-0.5 text-[9px] font-bold text-black shadow">
              You
            </div>
            <div className="h-3 w-3 rotate-45 bg-white -mt-1" />
          </div>
        </div>

        {/* Geofence Radar Pill Overlay */}
        <div className="absolute top-3 left-3 z-20">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[11px] font-semibold text-emerald-300 border border-emerald-500/30">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Geofence Verified: {currentGeofence.societyName.split(",")[0]}
          </span>
        </div>
      </div>

      {/* Delivery ETA Banner (Screen 4) */}
      <div className="flex items-center justify-between rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 sm:p-5">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-black font-black text-sm shadow">
            {order.etaMinutes} <br /> min
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Delivery</h2>
            <p className="text-xs text-muted-foreground">{order.statusText}</p>
          </div>
        </div>

        {/* Small artwork illustration */}
        <div className="text-3xl">🛵</div>
      </div>

      {/* Driver Profile Card (Screen 4) */}
      <div className="flex items-center justify-between rounded-3xl border border-white/[0.08] bg-[#121714] p-4">
        <div className="flex items-center gap-3">
          <img
            src={order.driver.photo}
            alt={order.driver.name}
            className="h-12 w-12 rounded-full object-cover border border-white/[0.1]"
          />
          <div>
            <h3 className="text-sm font-bold text-foreground">{order.driver.name}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <span>Driver</span>
              <span>·</span>
              <span className="text-amber-400 font-semibold">★ {order.driver.rating}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleMessage}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.04] text-foreground hover:bg-white/[0.08] transition active:scale-95"
            aria-label="Message driver"
          >
            <MessageCircle size={16} />
          </button>
          <button
            type="button"
            onClick={handleCall}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-black shadow hover:bg-emerald-400 transition active:scale-95"
            aria-label="Call driver"
          >
            <Phone size={16} />
          </button>
        </div>
      </div>

      {/* Order Progress Timeline Stepper (Screen 4) */}
      <div className="rounded-3xl border border-white/[0.08] bg-[#121714] p-5 sm:p-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
          Order Status
        </h3>
        <DSTimelineStepper steps={order.steps} />
      </div>
    </div>
  );
}
