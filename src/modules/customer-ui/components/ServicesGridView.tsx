"use client";

import React from "react";
import {
  UtensilsCrossed,
  Truck,
  Sparkles,
  Wrench,
  Zap,
  Car,
  Hammer,
  MoreHorizontal,
  ArrowLeft,
  MoreVertical,
} from "lucide-react";
import { useCustomerUI } from "../context/CustomerUIContext";

const PRO_SERVICES = [
  { id: "rest", title: "Restaurants", icon: UtensilsCrossed, color: "text-red-500", bg: "bg-red-50/70" },
  { id: "movers", title: "Movers", icon: Truck, color: "text-blue-500", bg: "bg-blue-50/70" },
  { id: "cleaning", title: "Cleaning", icon: Sparkles, color: "text-amber-500", bg: "bg-amber-50/70" },
  { id: "plumbers", title: "Plumbers", icon: Wrench, color: "text-emerald-500", bg: "bg-emerald-50/70" },
  { id: "electrician", title: "Electrician", icon: Zap, color: "text-purple-500", bg: "bg-purple-50/70" },
  { id: "auto", title: "Auto Detail...", icon: Car, color: "text-rose-500", bg: "bg-rose-50/70" },
  { id: "contractors", title: "Contractors", icon: Hammer, color: "text-indigo-500", bg: "bg-indigo-50/70" },
  { id: "more", title: "More", icon: MoreHorizontal, color: "text-gray-500", bg: "bg-gray-100" },
];

export function ServicesGridView() {
  const { setActiveCategory, setActiveTab } = useCustomerUI();

  return (
    <div className="space-y-6 pb-24 text-gray-900 font-sans">
      {/* =====================================================================
          1. TOP HEADER (Screen 3: Arafat's Projects / Services)
         ===================================================================== */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => setActiveTab("home")}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-xs"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>

        <h1 className="text-base font-bold tracking-tight text-gray-950">
          Arafat's Projects
        </h1>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 shadow-xs"
          aria-label="Menu"
        >
          <MoreVertical size={18} />
        </button>
      </div>

      {/* =====================================================================
          2. HIRE A LOCAL PRO TODAY (Screen 3: 4x2 Clean Squircles Grid)
         ===================================================================== */}
      <div>
        <h2 className="text-lg font-bold tracking-tight text-gray-950 mb-3">
          Hire a Local Pro Today
        </h2>

        {/* 4x2 Squircle Grid exactly from Screen 3 */}
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5">
          {PRO_SERVICES.map((pro) => {
            const Icon = pro.icon;
            return (
              <button
                key={pro.id}
                type="button"
                onClick={() => {
                  if (pro.id === "rest") setActiveCategory("FAST_FOOD");
                  else if (pro.id === "cleaning") setActiveCategory("LAUNDRY");
                  else setActiveCategory("ALL");
                  setActiveTab("home");
                }}
                className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-3 text-center shadow-xs hover:border-gray-200 hover:bg-gray-50 select-none"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${pro.bg} ${pro.color}`}
                >
                  <Icon size={22} />
                </div>
                <span className="mt-2 text-xs font-semibold text-gray-800 line-clamp-1">
                  {pro.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          3. TRANSFORM YOUR HOME (Screen 3: Carousel / Grid Cards)
         ===================================================================== */}
      <div>
        <div className="mb-3.5 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-gray-950">
            Transform Your Home
          </h2>
          <span className="text-xs font-semibold text-gray-500 hover:text-red-500 cursor-pointer">
            See all
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Card 1: Upgrade your Kitchen */}
          <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xs">
            <div className="relative h-44 w-full">
              <img
                src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80"
                alt="Modern Kitchen"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="text-base font-bold text-gray-950">
                Upgrade your Kitchen
              </h3>
              <p className="mt-1.5 text-xs text-gray-500 leading-relaxed line-clamp-2">
                Transform your kitchen with modern appliances and stylish decor for a
                welcoming and inviting vibe.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("TIFFIN");
                  setActiveTab("home");
                }}
                className="mt-4 w-full rounded-full bg-red-500 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-red-600 active:bg-red-700"
              >
                Find kitchen Pros
              </button>
            </div>
          </div>

          {/* Card 2: Upgrade your Living Room */}
          <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xs">
            <div className="relative h-44 w-full">
              <img
                src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80"
                alt="Living Renovation"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="text-base font-bold text-gray-950">
                Upgrade your Home Living
              </h3>
              <p className="mt-1.5 text-xs text-gray-500 leading-relaxed line-clamp-2">
                Transform your apartment spaces with verified electricians, carpenters, and
                deep-cleaning specialists.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("ALL");
                  setActiveTab("home");
                }}
                className="mt-4 w-full rounded-full bg-red-500 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-red-600 active:bg-red-700"
              >
                Find home Pros
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
