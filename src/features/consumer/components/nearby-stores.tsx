"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { formatINR } from "@/core/money";
import {
  haversineDistanceKm,
  findNearestLocality,
  INDIAN_LOCALITIES,
  Coordinates,
} from "@/core/geo";
import type { PublicVendorItem } from "@/features/vendors/public-queries";

interface NearbyStoresProps {
  initialVendors: PublicVendorItem[];
}

const POPULAR_CITIES = [
  "All India",
  "Bengaluru",
  "Mumbai",
  "Delhi NCR",
  "Hyderabad",
  "Pune",
];

export function NearbyStores({ initialVendors }: NearbyStoresProps) {
  // User location state
  const [userLocation, setUserLocation] = useState<{
    coords: Coordinates | null;
    label: string;
    isGps: boolean;
  }>({
    coords: { latitude: 12.9121, longitude: 77.6446 }, // Default to Bengaluru HSR
    label: "HSR Layout, Bengaluru",
    isGps: false,
  });

  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Filters
  const [selectedCity, setSelectedCity] = useState("All India");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "tiffin" | "water">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal for viewing vendor menu / subscription options
  const [selectedVendor, setSelectedVendor] = useState<PublicVendorItem | null>(null);

  // GPS auto-detect handler
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const { locality, distanceKm } = findNearestLocality(lat, lng);

        const label =
          distanceKm < 20
            ? `${locality.name}, ${locality.city}`
            : `GPS (${lat.toFixed(2)}, ${lng.toFixed(2)})`;

        setUserLocation({
          coords: { latitude: lat, longitude: lng },
          label,
          isGps: true,
        });
        setSelectedCity("All India"); // Reset city filter so nearby search takes precedence
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        setGpsError(
          err.code === 1
            ? "Location permission denied. Please search or pick a city below."
            : "Could not retrieve GPS coordinates. Please select your city."
        );
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Select popular locality or city
  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setGpsError(null);

    if (city === "All India") {
      setUserLocation({
        coords: null,
        label: "Pan-India",
        isGps: false,
      });
      return;
    }

    // Find the first centroid of that city
    const centroid = INDIAN_LOCALITIES.find((l) => l.city === city);
    if (centroid) {
      setUserLocation({
        coords: { latitude: centroid.latitude, longitude: centroid.longitude },
        label: `${centroid.name}, ${centroid.city}`,
        isGps: false,
      });
    }
  };

  // Compute distances and sort vendors
  const sortedAndFilteredVendors = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return initialVendors
      .map((vendor) => {
        let distanceKm: number | null = null;
        if (userLocation.coords) {
          distanceKm = haversineDistanceKm(
            userLocation.coords.latitude,
            userLocation.coords.longitude,
            vendor.coordinates.latitude,
            vendor.coordinates.longitude
          );
        }
        return { ...vendor, distanceKm };
      })
      .filter((vendor) => {
        // City filter
        if (selectedCity !== "All India" && vendor.city.toLowerCase() !== selectedCity.toLowerCase()) {
          return false;
        }

        // Category filter
        if (selectedCategory !== "all" && !vendor.kinds.includes(selectedCategory)) {
          return false;
        }

        // Search query filter (matches name, area, city, or product names)
        if (q) {
          const nameMatch = vendor.name.toLowerCase().includes(q);
          const areaMatch = vendor.area.toLowerCase().includes(q);
          const cityMatch = vendor.city.toLowerCase().includes(q);
          const productMatch = vendor.products.some((p) =>
            p.name.toLowerCase().includes(q)
          );
          if (!nameMatch && !areaMatch && !cityMatch && !productMatch) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // If we have distance, sort closest first
        if (a.distanceKm !== null && b.distanceKm !== null) {
          return a.distanceKm - b.distanceKm;
        }
        return a.name.localeCompare(b.name);
      });
  }, [initialVendors, userLocation.coords, selectedCity, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Zomato-style Hyperlocal Location & Search Bar */}
      <div className="rounded-[18px] border border-line bg-surface p-4 sm:p-5 shadow-xs space-y-4">
        {/* Top line: Location detector */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-peach text-sm font-bold text-accent">
              📍
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-muted">Your Location:</span>
                <span className="text-sm font-bold text-ink">{userLocation.label}</span>
                {userLocation.isGps && (
                  <span className="rounded-full bg-good/10 px-2 py-0.5 text-[10px] font-semibold text-good">
                    GPS Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted">
                Showing verified suppliers serving your neighbourhood
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isLocating}
            onClick={handleDetectLocation}
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-[10px] bg-[#FAFAF7] border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-white active:scale-98 transition disabled:opacity-60"
          >
            <span>{isLocating ? "⏳ Detecting GPS..." : "🎯 Detect My Location"}</span>
          </button>
        </div>

        {gpsError && (
          <div className="rounded-[8px] bg-warn/10 p-2.5 text-xs text-warn flex items-center justify-between">
            <span>{gpsError}</span>
            <button
              type="button"
              onClick={() => setGpsError(null)}
              className="text-xs font-bold hover:underline"
            >
              ✕
            </button>
          </div>
        )}

        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search society, locality, or kitchen (e.g. HSR, Powai, Gurugram, Jain meals)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-[12px] border border-line bg-white px-4 py-2.5 text-xs text-ink placeholder:text-muted focus:outline-hidden focus:ring-2 focus:ring-accent"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-xs text-muted hover:text-ink"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick City Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="shrink-0 text-[11px] font-semibold text-muted pr-1">Cities:</span>
          {POPULAR_CITIES.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => handleCitySelect(city)}
              className={`shrink-0 rounded-[8px] px-3 py-1 font-medium transition ${
                selectedCity === city
                  ? "bg-accent text-white shadow-xs"
                  : "bg-[#FAFAF7] text-ink border border-line hover:bg-white"
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Category Toggle Tabs */}
        <div className="flex items-center gap-2 border-t border-line/60 pt-3">
          <span className="text-[11px] font-semibold text-muted">Filter:</span>
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`rounded-[8px] px-2.5 py-1 text-xs font-semibold transition ${
              selectedCategory === "all"
                ? "bg-ink text-white"
                : "bg-surface text-muted hover:text-ink"
            }`}
          >
            All Services ({initialVendors.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("tiffin")}
            className={`rounded-[8px] px-2.5 py-1 text-xs font-semibold transition ${
              selectedCategory === "tiffin"
                ? "bg-ink text-white"
                : "bg-surface text-muted hover:text-ink"
            }`}
          >
            🍲 Tiffin Services
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("water")}
            className={`rounded-[8px] px-2.5 py-1 text-xs font-semibold transition ${
              selectedCategory === "water"
                ? "bg-ink text-white"
                : "bg-surface text-muted hover:text-ink"
            }`}
          >
            💧 20L Water Cans
          </button>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-base font-bold text-ink">
            Nearby Verified Partners
          </h2>
          <p className="text-xs text-muted">
            {sortedAndFilteredVendors.length} services available near{" "}
            <span className="font-semibold text-ink">{userLocation.label}</span>
          </p>
        </div>
      </div>

      {/* Stores Grid (Zomato style) */}
      {sortedAndFilteredVendors.length === 0 ? (
        <div className="rounded-[16px] border border-line bg-surface p-8 text-center space-y-3">
          <span className="text-3xl">🔍</span>
          <h3 className="text-sm font-semibold text-ink">No suppliers found in this radius</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            We are expanding neighbourhood by neighbourhood. Try selecting &ldquo;All India&rdquo; or another city above to explore verified partners.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCity("All India");
              setSelectedCategory("all");
              setSearchQuery("");
            }}
            className="inline-flex rounded-[8px] bg-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sortedAndFilteredVendors.map((vendor) => {
            const isTiffin = vendor.kinds.includes("tiffin");
            const isWater = vendor.kinds.includes("water");
            const isDeliveringHere = vendor.distanceKm !== null && vendor.distanceKm <= 12;

            return (
              <div
                key={vendor.id}
                className="flex flex-col justify-between rounded-[16px] border border-line bg-surface p-5 shadow-xs transition hover:border-accent hover:shadow-md"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-peach px-2 py-0.5 text-[10px] font-bold text-accent">
                        {isTiffin && isWater
                          ? "🍲 Tiffin & 💧 Water"
                          : isTiffin
                            ? "🍲 Tiffin Service"
                            : "💧 20L Water"}
                      </span>
                      <span className="rounded-full bg-good/10 px-2 py-0.5 text-[10px] font-semibold text-good">
                        ✓ Verified Partner
                      </span>
                    </div>

                    {vendor.distanceKm !== null && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold font-mono ${
                          isDeliveringHere
                            ? "bg-good/15 text-good"
                            : "bg-[#FAFAF7] text-muted border border-line"
                        }`}
                      >
                        {vendor.distanceKm.toFixed(1)} km
                      </span>
                    )}
                  </div>

                  {/* Vendor Details */}
                  <div>
                    <h3 className="text-base font-bold tracking-tight text-ink">
                      {vendor.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted">
                      📍 {vendor.area}, {vendor.city}
                    </p>
                  </div>

                  {/* Delivery Status & Geofence pill */}
                  <div className="rounded-[10px] bg-[#FAFAF7] p-2.5 text-xs text-muted space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-ink">
                        {isDeliveringHere
                          ? "🟢 Delivering to your location"
                          : `Delivers within 10 km of ${vendor.area}`}
                      </span>
                      <span className="text-[11px] font-mono text-muted">
                        {vendor.products[0]?.cutoffAt
                          ? `Cutoff ${vendor.products[0].cutoffAt} IST`
                          : "Scheduled run"}
                      </span>
                    </div>

                    {/* Products summary */}
                    <div className="text-[11px] text-muted pt-1 border-t border-line/60">
                      Plans: {vendor.products.map((p) => p.name).join(", ") || "Daily Service"}
                    </div>
                  </div>
                </div>

                {/* Price and CTA */}
                <div className="mt-4 pt-3 border-t border-line flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-muted uppercase font-semibold">Starting from</span>
                    <div className="text-sm font-bold font-mono text-ink">
                      {vendor.minPricePaise > 0
                        ? `${formatINR(vendor.minPricePaise)} / unit`
                        : "Custom plan"}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedVendor(vendor)}
                    className="inline-flex min-h-9 items-center justify-center rounded-[10px] bg-accent px-3.5 py-1.5 text-xs font-semibold text-white hover:opacity-90 active:scale-95 transition shadow-xs"
                  >
                    View Menu & Plans →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vendor Details & Menu Modal / Drawer */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-[20px] sm:rounded-[18px] border border-line bg-surface p-5 sm:p-6 space-y-5 shadow-xl">
            <div className="flex items-start justify-between border-b border-line pb-4">
              <div>
                <span className="rounded-full bg-peach px-2.5 py-0.5 text-[10px] font-bold text-accent">
                  {selectedVendor.area}, {selectedVendor.city}
                </span>
                <h3 className="mt-1 text-lg font-bold text-ink sm:text-xl">
                  {selectedVendor.name}
                </h3>
                <p className="text-xs text-muted">
                  Direct Kitchen / Water Supplier • Partner Phone:{" "}
                  <a href={`tel:${selectedVendor.phone}`} className="font-semibold text-accent underline">
                    {selectedVendor.phone}
                  </a>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedVendor(null)}
                className="rounded-full p-1 text-muted hover:text-ink text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Menu & Product Plans */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                Available Subscription Plans & Menu
              </h4>

              {selectedVendor.products.length === 0 ? (
                <p className="text-xs text-muted">Contact the merchant directly for seasonal menu details.</p>
              ) : (
                <div className="divide-y divide-line rounded-[12px] border border-line bg-white">
                  {selectedVendor.products.map((p) => (
                    <div key={p.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-ink">{p.name}</span>
                          <span className="rounded-md bg-[#FAFAF7] border border-line px-1.5 py-0.5 text-[10px] font-medium text-muted uppercase">
                            {p.shift}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted">
                          Daily cutoff: {p.cutoffAt} IST
                          {p.depositPaise > 0 ? ` · Deposit: ${formatINR(p.depositPaise)}` : ""}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold font-mono text-ink">
                          {formatINR(p.pricePaise)}
                        </span>
                        <span className="block text-[10px] text-muted">per delivery</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* How to Connect / Subscribe */}
            <div className="rounded-[12px] bg-[#FAFAF7] border border-line p-4 space-y-3 text-xs">
              <div className="font-semibold text-ink">How recurring subscriptions work on RUXS:</div>
              <ul className="space-y-1.5 text-muted text-[11px]">
                <li>✓ You get a private household link to manage skips, extras, and pauses with 1-tap.</li>
                <li>✓ Zero advance lock-in; payments are tracked in a shared khata and paid monthly via UPI.</li>
                <li>✓ Contact the kitchen below to activate your society stop.</li>
              </ul>

              <div className="flex gap-2 pt-1">
                <a
                  href={`tel:${selectedVendor.phone}`}
                  className="flex-1 min-h-10 rounded-[10px] bg-white border border-line py-2 text-center text-xs font-semibold text-ink hover:bg-bg transition"
                >
                  📞 Call {selectedVendor.name}
                </a>

                <a
                  href={`https://wa.me/${selectedVendor.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                    `Hi ${selectedVendor.name}, I want to start a daily subscription through RUXS in ${selectedVendor.area}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-h-10 rounded-[10px] bg-accent py-2 text-center text-xs font-semibold text-white hover:opacity-90 transition shadow-xs flex items-center justify-center gap-1.5"
                >
                  <span>💬 Message to Order</span>
                </a>
              </div>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setSelectedVendor(null)}
                className="text-xs text-muted hover:text-ink underline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
