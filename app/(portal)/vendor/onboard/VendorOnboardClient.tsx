"use client";

import React, { useState } from "react";
import Link from "next/link";
import { RuxsSpinner } from "@/components/ui/LoadingState";
import { Clock, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Milk, Droplet, Utensils } from "lucide-react";

interface VendorCreatedState {
  id: string;
  businessName: string;
  slug: string;
  phone: string;
  upiId: string;
  vendorType: "MILKMAN" | "WATER_SERVICE" | "TIFFIN";
  status: "PENDING_APPROVAL" | "VERIFIED";
  locality: string;
  coveredSocieties: string[];
}

export default function VendorOnboardClient() {
  const [vendorType, setVendorType] = useState<"MILKMAN" | "WATER_SERVICE" | "TIFFIN">("TIFFIN");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [upiId, setUpiId] = useState("");
  const [locality, setLocality] = useState("");
  const [societyInput, setSocietyInput] = useState("");
  const [societies, setSocieties] = useState<string[]>(["Sobha Classic", "Purva Fairmont"]);
  const [fssaiNumber, setFssaiNumber] = useState("");

  // Type-specific state
  // Milkman
  const [milkVarieties, setMilkVarieties] = useState<string[]>(["Fresh Cow Milk (4.5% Fat)", "Buffalo Rich Milk (6.5% Fat)"]);
  const [hasGlassBottles, setHasGlassBottles] = useState(true);

  // Water
  const [canCapacity, setCanCapacity] = useState("20L");
  const [canDepositRupees, setCanDepositRupees] = useState(150);

  // Tiffin
  const [shiftsServed, setShiftsServed] = useState<string[]>(["LUNCH", "DINNER"]);
  const [dabbaExchange, setDabbaExchange] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdVendor, setCreatedVendor] = useState<VendorCreatedState | null>(null);

  const handleAddSociety = () => {
    const trimmed = societyInput.trim();
    if (trimmed && !societies.includes(trimmed)) {
      setSocieties([...societies, trimmed]);
      setSocietyInput("");
    }
  };

  const handleRemoveSociety = (name: string) => {
    setSocieties(societies.filter((s) => s !== name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const typeConfig =
        vendorType === "MILKMAN"
          ? { milkVarieties, hasGlassBottles }
          : vendorType === "WATER_SERVICE"
          ? { canCapacity, canDepositRupees }
          : { shiftsServed, dabbaExchange };

      const res = await fetch("/api/vendor/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          phone,
          upiId,
          vendorType,
          primaryCategory: vendorType === "MILKMAN" ? "MILK" : vendorType === "WATER_SERVICE" ? "WATER" : "TIFFIN",
          locality,
          city: "Bengaluru",
          coveredSocieties: societies,
          fssaiNumber: fssaiNumber.trim() || undefined,
          typeConfig,
        }),
      });

      const data = (await res.json()) as { success: boolean; data?: VendorCreatedState; error?: { message: string } };
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to submit merchant registration");
      }

      setCreatedVendor(data.data!);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit merchant registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/" className="text-xs text-primary hover:underline flex items-center gap-1 mb-3">
          ← Back to RUXS Home
        </Link>
        <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 border border-primary/30 px-2.5 py-1 rounded-full">
          Merchant Onboarding Portal
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold mt-2 text-foreground">Register Your Local Route</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Automate daily fulfillment, cutoffs, WhatsApp morning polls, and monthly Khata payments for your society route.
        </p>
      </div>

      {createdVendor ? (
        /* APPLICATION UNDER REVIEW SCREEN */
        <div className="bg-card border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-card-foreground space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xl">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">Application Under Review</h2>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-400">
                  PENDING APPROVAL
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Reference ID: <span className="font-mono text-foreground">{createdVendor.id}</span>
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-xs space-y-2.5 leading-relaxed text-muted-foreground">
            <p className="text-foreground font-medium">
              Thank you, <span className="text-primary font-bold">{createdVendor.businessName}</span>. Your merchant application has been queued for verification.
            </p>
            <p>
              To protect apartment societies, all local Milkmen, Water Distributors, and Tiffin Services must be approved by Platform Mission Control (<span className="text-foreground font-medium">sh20raj@gmail.com</span>) before receiving customer subscriptions and automated driver run-sheets.
            </p>
            <p>
              Once approved, your merchant operations cockpit and direct access PIN will be generated and sent via WhatsApp to <span className="font-mono text-foreground font-semibold">{createdVendor.phone}</span>.
            </p>
          </div>

          <div className="bg-muted/30 border border-border rounded-2xl p-4 text-xs space-y-2">
            <div className="flex justify-between py-1 border-b border-white/[0.06]">
              <span className="text-muted-foreground">Business:</span>
              <span className="text-foreground font-medium">{createdVendor.businessName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.06]">
              <span className="text-muted-foreground">Merchant Type:</span>
              <span className="text-primary font-semibold">
                {createdVendor.vendorType === "MILKMAN" ? "🥛 Milkman Dairy" : createdVendor.vendorType === "WATER_SERVICE" ? "💧 Water Distribution" : "🍱 Tiffin & Meals Service"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.06]">
              <span className="text-muted-foreground">Locality:</span>
              <span className="text-foreground">{createdVendor.locality}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Societies Requested:</span>
              <span className="text-foreground">{createdVendor.coveredSocieties.join(", ")}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="flex-1 text-center bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl text-xs transition-all shadow-md"
            >
              Return to Platform Home
            </Link>
            <Link
              href={`/admin/${createdVendor.slug}`}
              className="text-center border border-white/[0.1] bg-white/[0.02] hover:bg-white/[0.05] text-muted-foreground hover:text-foreground font-semibold py-3 px-4 rounded-xl text-xs transition-all"
            >
              Admin Approval Link
            </Link>
          </div>
        </div>
      ) : (
        /* REGISTRATION FORM */
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 text-destructive text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: SELECT VENDOR TYPE */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              1. Select Your Service Category
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  type: "TIFFIN" as const,
                  label: "Tiffin Service",
                  tag: "Lunch & Dinner Thalis",
                  icon: Utensils,
                  emoji: "🍱",
                },
                {
                  type: "MILKMAN" as const,
                  label: "Milkman",
                  tag: "Cow, Buffalo & A2 Dairy",
                  icon: Milk,
                  emoji: "🥛",
                },
                {
                  type: "WATER_SERVICE" as const,
                  label: "Water Service",
                  tag: "20L RO & Mineral Cans",
                  icon: Droplet,
                  emoji: "💧",
                },
              ].map((item) => {
                const isSelected = vendorType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setVendorType(item.type)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-lg text-primary"
                        : "border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="text-2xl mb-2">{item.emoji}</div>
                    <div className="text-xs font-bold text-foreground">{item.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{item.tag}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: BUSINESS ESSENTIALS */}
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground border-b border-white/[0.06] pb-3">
              2. Business Details
            </h3>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Shop / Brand Name *
              </label>
              <input
                type="text"
                required
                placeholder={
                  vendorType === "MILKMAN"
                    ? "e.g. Bangalore Organic Cow Milk"
                    : vendorType === "WATER_SERVICE"
                    ? "e.g. AquaPure 20L Water Suppliers"
                    : "e.g. Sharma Pure Veg Homestyle Tiffin"
                }
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-background border border-input rounded-xl px-3 py-2.5 text-xs text-foreground outline-none focus:border-primary/50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Primary Mobile Number (WhatsApp) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl px-3 py-2.5 text-xs text-foreground font-mono outline-none focus:border-primary/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  UPI ID for Direct Settlements *
                </label>
                <input
                  type="text"
                  required
                  placeholder="merchant@okhdfcbank or 9876543210@paytm"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl px-3 py-2.5 text-xs text-foreground font-mono outline-none focus:border-primary/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Locality / Hub Base *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HSR Layout Sector 2"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl px-3 py-2.5 text-xs text-foreground outline-none focus:border-primary/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  FSSAI / Trade License (Optional)
                </label>
                <input
                  type="text"
                  placeholder="14-digit FSSAI number"
                  value={fssaiNumber}
                  onChange={(e) => setFssaiNumber(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl px-3 py-2.5 text-xs text-foreground font-mono outline-none focus:border-primary/50"
                />
              </div>
            </div>
          </div>

          {/* STEP 3: TYPE-SPECIFIC QUESTIONS */}
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground border-b border-white/[0.06] pb-3">
              3. Service Configuration ({vendorType === "MILKMAN" ? "Dairy" : vendorType === "WATER_SERVICE" ? "Water" : "Kitchen"})
            </h3>

            {vendorType === "MILKMAN" && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-foreground mb-1.5">
                    Milk Varieties Offered
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "Fresh Cow Milk (4.5% Fat)",
                      "Buffalo Rich Milk (6.5% Fat)",
                      "Gir Cow A2 Milk",
                      "Organic Toned Milk",
                    ].map((v) => {
                      const checked = milkVarieties.includes(v);
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => {
                            if (checked) setMilkVarieties(milkVarieties.filter((item) => item !== v));
                            else setMilkVarieties([...milkVarieties, v]);
                          }}
                          className={`rounded-xl border p-2 text-left text-xs transition ${
                            checked
                              ? "border-primary/40 bg-primary/10 text-primary font-semibold"
                              : "border-white/[0.08] bg-white/[0.02] text-muted-foreground"
                          }`}
                        >
                          {checked ? "✓ " : "+ "}{v}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/20 p-3">
                  <div>
                    <p className="font-semibold text-foreground">Glass Bottle Reusable Packaging</p>
                    <p className="text-[10px] text-muted-foreground">Doorstep collection of yesterday&apos;s empty glass bottle</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasGlassBottles}
                    onChange={(e) => setHasGlassBottles(e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                </div>
              </div>
            )}

            {vendorType === "WATER_SERVICE" && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-foreground mb-1">Standard Jar Size</label>
                    <select
                      value={canCapacity}
                      onChange={(e) => setCanCapacity(e.target.value)}
                      className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs text-foreground"
                    >
                      <option value="20L">20 Litre RO Jar</option>
                      <option value="10L">10 Litre Jar</option>
                      <option value="25L">25 Litre Can</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-foreground mb-1">Can Deposit per New Jar (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={canDepositRupees}
                      onChange={(e) => setCanDepositRupees(Number(e.target.value))}
                      className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs text-foreground font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {vendorType === "TIFFIN" && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-foreground mb-1.5">Daily Shifts Cooked</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "LUNCH", label: "Afternoon Lunch (12:30 PM)" },
                      { id: "DINNER", label: "Night Dinner (07:30 PM)" },
                    ].map((shift) => {
                      const checked = shiftsServed.includes(shift.id);
                      return (
                        <button
                          key={shift.id}
                          type="button"
                          onClick={() => {
                            if (checked) setShiftsServed(shiftsServed.filter((s) => s !== shift.id));
                            else setShiftsServed([...shiftsServed, shift.id]);
                          }}
                          className={`rounded-xl border p-2.5 text-left text-xs transition ${
                            checked
                              ? "border-primary/40 bg-primary/10 text-primary font-semibold"
                              : "border-white/[0.08] bg-white/[0.02] text-muted-foreground"
                          }`}
                        >
                          {checked ? "✓ " : "+ "}{shift.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/20 p-3">
                  <div>
                    <p className="font-semibold text-foreground">Stainless Steel Dabba Exchange</p>
                    <p className="text-[10px] text-muted-foreground">Insulated tiffin containers swapped upon next delivery</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={dabbaExchange}
                    onChange={(e) => setDabbaExchange(e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                </div>
              </div>
            )}
          </div>

          {/* STEP 4: COVERED APARTMENTS / SOCIETIES */}
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6 space-y-3">
            <h3 className="text-sm font-bold text-foreground border-b border-white/[0.06] pb-3">
              4. Covered Apartment Societies
            </h3>
            <p className="text-xs text-muted-foreground">
              Add the residential gated communities you currently deliver to.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Prestige Falcon, Sobha Classic"
                value={societyInput}
                onChange={(e) => setSocietyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSociety();
                  }
                }}
                className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs text-foreground outline-none"
              />
              <button
                type="button"
                onClick={handleAddSociety}
                className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold px-4 py-2 rounded-xl text-xs whitespace-nowrap"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {societies.map((s) => (
                <span
                  key={s}
                  className="bg-primary/10 border border-primary/20 text-primary text-xs px-3 py-1 rounded-full flex items-center gap-1.5"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => handleRemoveSociety(s)}
                    className="hover:text-destructive font-bold text-sm"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl text-sm transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RuxsSpinner size="sm" color="text-primary-foreground" />
                <span>Submitting application for review...</span>
              </>
            ) : (
              <>
                <span>Submit Merchant Application</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
