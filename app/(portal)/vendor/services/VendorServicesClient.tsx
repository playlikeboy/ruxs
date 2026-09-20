"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Clock3, PackageCheck, Plus, Settings2, Store } from "lucide-react";
import { ServiceDefinition } from "@/src/modules/services/service-schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RuxsCardListSkeleton } from "@/components/ui/LoadingState";

export default function VendorServicesClient() {
  const searchParams = useSearchParams();
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("Daily Executive Veg Lunch");
  const [category, setCategory] = useState("TIFFIN");
  const [productName, setProductName] = useState("Standard Veg Thali");
  const [priceInRupees, setPriceInRupees] = useState(120);
  const [cutoffTimeStr, setCutoffTimeStr] = useState("10:00");
  const [pollTimeStr, setPollTimeStr] = useState("08:30");
  const [requiresAssetTracking, setRequiresAssetTracking] = useState(true);
  const [lateCancellationFeePercent, setLateCancellationFeePercent] = useState(50);

  // Load verified vendors
  useEffect(() => {
    async function loadVendors() {
      try {
        const res = await fetch("/api/marketplace/vendors");
        const data = (await res.json()) as { success: boolean; data?: any[] };
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setVendors(data.data);
          const urlParam = searchParams.get("tenantId") || searchParams.get("slug");
          const matched = data.data.find((v: any) => v.id === urlParam || v.slug === urlParam);
          setSelectedTenantId(matched ? matched.id : data.data[0].id);
        }
      } catch (err) {
        console.error("Failed to load vendors:", err);
      }
    }
    loadVendors();
  }, [searchParams]);

  const fetchServices = async (tenantIdToFetch?: string) => {
    const tid = tenantIdToFetch || selectedTenantId;
    if (!tid) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/vendor/services?tenantId=${tid}`);
      const data = (await res.json()) as { success: boolean; data?: ServiceDefinition[] };
      if (data.success && data.data) setServices(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTenantId) {
      void fetchServices(selectedTenantId);
      const currentV = vendors.find((v) => v.id === selectedTenantId);
      if (currentV) {
        if (currentV.vendorType === "MILKMAN") {
          setCategory("MILK");
          setName("Farm Fresh Desi Cow Milk");
          setProductName("A2 Gir Cow Milk 1L Bottle");
          setPriceInRupees(42);
          setCutoffTimeStr("21:00");
          setPollTimeStr("18:00");
          setRequiresAssetTracking(true);
        } else if (currentV.vendorType === "WATER_SERVICE") {
          setCategory("WATER");
          setName("20L Mineral Water Jar Daily Supply");
          setProductName("Bisleri 20L Bubbletop Can");
          setPriceInRupees(80);
          setCutoffTimeStr("08:00");
          setPollTimeStr("06:00");
          setRequiresAssetTracking(true);
        } else {
          setCategory("TIFFIN");
          setName("Daily Executive Veg Lunch");
          setProductName("Standard Veg Thali");
          setPriceInRupees(120);
          setCutoffTimeStr("10:00");
          setPollTimeStr("08:30");
          setRequiresAssetTracking(true);
        }
      }
    }
  }, [selectedTenantId]);

  const activeVendor = vendors.find((v) => v.id === selectedTenantId) || vendors[0];

  const handleCreateService = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedTenantId) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/vendor/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: selectedTenantId,
          name,
          category,
          productName,
          unitType: category === "MILK" ? "LITER" : category === "WATER" ? "CAN" : "MEAL",
          priceInRupees: Number(priceInRupees),
          cutoffTimeStr,
          pollTimeStr,
          requiresAssetTracking,
          lateCancellationFeePercent: Number(lateCancellationFeePercent),
        }),
      });
      const data = (await res.json()) as { success: boolean; data?: ServiceDefinition; error?: { message: string } };
      if (!res.ok || !data.success) throw new Error(data.error?.message || "Failed to create service");
      await fetchServices(selectedTenantId);
      setName("");
      setProductName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create service");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <a href="/vendor/dashboard" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Operations
            </a>
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">Vendor configuration</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">Services & pricing</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Keep the recurring offer simple: what customers buy, when the kitchen locks, and what happens after cutoff.
            </p>
          </div>
          <div className="flex flex-col sm:items-end gap-2">
            {vendors.length > 0 && (
              <div className="flex items-center gap-2">
                <Store className="h-3.5 w-3.5 text-primary" />
                <select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="h-8 rounded-lg border border-white/[0.1] bg-white/[0.04] px-2 text-xs font-semibold text-foreground outline-none"
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vendorType === "MILKMAN" ? "🥛" : v.vendorType === "WATER_SERVICE" ? "💧" : "🍱"} {v.businessName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Badge variant="outline" className="w-fit rounded-full border-white/[0.1] bg-white/[0.02] px-3 py-1 text-[10px]">
              Active · {activeVendor?.businessName || selectedTenantId}
            </Badge>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[.86fr_1.14fr]">
          <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Plus className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Create a recurring offer</p>
                <p className="mt-1 text-xs text-muted-foreground">A clear default is easier to sell and easier to run.</p>
              </div>
            </div>

            {error && <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">{error}</div>}

            <form onSubmit={handleCreateService} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 w-full rounded-xl border border-white/[0.1] bg-white/[0.025] px-3 text-xs text-foreground outline-none focus:border-ring">
                  <option value="TIFFIN">Tiffin / meals</option>
                  <option value="WATER">20L water</option>
                  <option value="MILK">Milk & dairy</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Service name</Label>
                <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Daily North Indian Lunch" className="h-10 rounded-xl border-white/[0.1] bg-white/[0.025] text-xs" />
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                <div className="space-y-1.5">
                  <Label className="text-xs">Default product</Label>
                  <Input required value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Standard Veg Thali" className="h-10 rounded-xl border-white/[0.1] bg-white/[0.025] text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Price (₹)</Label>
                  <Input type="number" min="1" required value={priceInRupees} onChange={(e) => setPriceInRupees(Number(e.target.value))} className="h-10 rounded-xl border-white/[0.1] bg-white/[0.025] font-mono text-xs" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Morning poll</Label>
                  <Input value={pollTimeStr} onChange={(e) => setPollTimeStr(e.target.value)} className="h-10 rounded-xl border-white/[0.1] bg-white/[0.025] font-mono text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Hard cutoff</Label>
                  <Input value={cutoffTimeStr} onChange={(e) => setCutoffTimeStr(e.target.value)} className="h-10 rounded-xl border-white/[0.1] bg-white/[0.025] font-mono text-xs" />
                </div>
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-black/10 p-4">
                <input type="checkbox" checked={requiresAssetTracking} onChange={(e) => setRequiresAssetTracking(e.target.checked)} className="h-4 w-4 accent-primary" />
                <span>
                  <span className="block text-xs font-medium">Track reusable containers</span>
                  <span className="mt-1 block text-[10px] leading-5 text-muted-foreground">Use for tiffins and water jars with deposit handling.</span>
                </span>
              </label>

              <div className="rounded-2xl border border-white/[0.08] bg-black/10 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium">Late skip fee</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">Applied after the cutoff window.</p>
                  </div>
                  <Input type="number" min="0" max="100" value={lateCancellationFeePercent} onChange={(e) => setLateCancellationFeePercent(Number(e.target.value))} className="h-9 w-20 rounded-lg border-white/[0.1] bg-white/[0.025] text-right font-mono text-xs" />
                </div>
              </div>

              <Button disabled={submitting} className="h-11 w-full rounded-xl text-xs font-semibold">
                <Check className="mr-2 h-3.5 w-3.5" />
                {submitting ? "Saving…" : "Save service"}
              </Button>
            </form>
          </section>

          <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025]">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-5 sm:px-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-subtle">Catalog</p>
                <h2 className="mt-2 text-xl font-semibold">Active offerings</h2>
              </div>
              <Settings2 className="h-5 w-5 text-subtle" />
            </div>

            <div className="divide-y divide-white/[0.07]">
              {loading ? (
                <div className="p-5">
                  <RuxsCardListSkeleton count={2} />
                </div>
              ) : services.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <PackageCheck className="mx-auto h-6 w-6 text-subtle" />
                  <p className="mt-3 text-sm font-medium">No services yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">Create the first recurring offering on the left.</p>
                </div>
              ) : (
                services.map((service) => (
                  <div key={service.id} className="px-5 py-5 sm:px-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/10 text-[10px] text-primary">{service.category}</Badge>
                        <h3 className="mt-2 text-sm font-semibold">{service.name}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">{service.products.map((product) => product.unitType.toLowerCase()).join(" · ")}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        {service.products.map((product) => (
                          <p key={product.id} className="text-lg font-semibold text-primary">₹{(product.basePricePaise / 100).toFixed(0)}</p>
                        ))}
                        <p className="mt-1 text-[10px] text-muted-foreground">per unit</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      <div className="rounded-xl border border-white/[0.07] p-3">
                        <Clock3 className="h-3.5 w-3.5 text-subtle" />
                        <p className="mt-2 text-[10px] uppercase tracking-[0.1em] text-subtle">Poll</p>
                        <p className="mt-1 text-xs font-medium">{service.pollTimeStr}</p>
                      </div>
                      <div className="rounded-xl border border-white/[0.07] p-3">
                        <Clock3 className="h-3.5 w-3.5 text-subtle" />
                        <p className="mt-2 text-[10px] uppercase tracking-[0.1em] text-subtle">Cutoff</p>
                        <p className="mt-1 text-xs font-medium">{service.cutoffTimeStr}</p>
                      </div>
                      <div className="rounded-xl border border-white/[0.07] p-3">
                        <PackageCheck className="h-3.5 w-3.5 text-subtle" />
                        <p className="mt-2 text-[10px] uppercase tracking-[0.1em] text-subtle">Returns</p>
                        <p className="mt-1 text-xs font-medium">{service.requiresAssetTracking ? "Tracked" : "Not tracked"}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
