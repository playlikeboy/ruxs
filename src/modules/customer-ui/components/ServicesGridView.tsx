"use client";

import React from "react";
import {
  Utensils,
  Truck,
  Sparkles,
  Wrench,
  Zap,
  Car,
  Users,
  MoreHorizontal,
  ArrowRight,
} from "lucide-react";
import { useCustomerUI } from "../context/CustomerUIContext";

const PRO_SERVICES = [
  { id: "rest", title: "Restaurants", icon: "🍱", subtitle: "Homestyle & dining" },
  { id: "movers", title: "Movers", icon: "📦", subtitle: "Society shifting" },
  { id: "cleaning", title: "Cleaning", icon: "🧹", subtitle: "Deep home clean" },
  { id: "plumbers", title: "Plumbers", icon: "🚰", subtitle: "Pipes & leaks" },
  { id: "electrician", title: "Electrician", icon: "⚡", subtitle: "Wiring & power" },
  { id: "auto", title: "Auto Detail", icon: "🚗", subtitle: "Doorstep wash" },
  { id: "contractors", title: "Contractors", icon: "👷", subtitle: "Carpentry & paint" },
  { id: "more", title: "More", icon: "✨", subtitle: "Explore all" },
];

export function ServicesGridView() {
  const { setActiveCategory, setActiveTab } = useCustomerUI();

  return (
    <div className="space-y-6 pb-24">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Hire a Local Pro Today
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Verified domestic service partners serving your apartment complex
        </p>
      </div>

      {/* 2x4 Grid (Image 2 Screen 3) */}
      <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
        {PRO_SERVICES.map((pro) => (
          <button
            key={pro.id}
            type="button"
            onClick={() => {
              setActiveCategory("ALL");
              setActiveTab("home");
            }}
            className="group flex flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-[#121714] p-3 text-center transition-all hover:border-emerald-500/40 hover:bg-emerald-500/[0.06] active:scale-95 select-none"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-2xl transition-transform group-hover:scale-110">
              {pro.icon}
            </div>
            <span className="mt-2 text-xs font-bold text-foreground group-hover:text-emerald-400 transition-colors line-clamp-1">
              {pro.title}
            </span>
          </button>
        ))}
      </div>

      {/* Transform Your Home Showcase Cards (Image 2 Screen 3) */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Transform Your Home</h3>
          <span className="text-xs font-bold text-emerald-400">See all</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#121714]">
            <div className="relative h-40 w-full">
              <img
                src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80"
                alt="Modern Kitchen"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-4">
              <h4 className="text-sm font-bold text-foreground">Upgrade your Kitchen</h4>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                Transform your kitchen with modern appliances and stylish decor for a welcoming vibe.
              </p>
              <button
                type="button"
                className="mt-3 w-full rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-black transition hover:bg-emerald-400"
              >
                Find kitchen Pros
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#121714]">
            <div className="relative h-40 w-full">
              <img
                src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80"
                alt="Home Renovation"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-4">
              <h4 className="text-sm font-bold text-foreground">Complete Society Deep Clean</h4>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                Certified sanitized deep clean covering bathrooms, balconies, windows, and upholstery.
              </p>
              <button
                type="button"
                className="mt-3 w-full rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-black transition hover:bg-emerald-400"
              >
                Find Cleaning Pros
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
