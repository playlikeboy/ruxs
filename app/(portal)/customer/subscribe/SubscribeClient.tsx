"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@hexclave/next";
import { Subscription } from "@/src/modules/subscriptions/subscription-schema";
import {
  ArrowRight,
  Calendar,
  Check,
  CircleAlert,
  Lock,
  Pause,
  Play,
  Plus,
  Receipt,
  Sparkles,
  Users,
  Utensils,
  X,
} from "@/components/icons/animated";
import { RuxsCardListSkeleton, RuxsSpinner } from "@/components/ui/LoadingState";

const products = [
  {
    id: "prd_thali",
    category: "Meals",
    name: "Standard Veg Thali",
    detail: "Balanced lunch, delivered warm",
    price: 12000,
    unit: "meal",
  },
  {
    id: "prd_water",
    category: "Water",
    name: "20L Mineral Water Jar",
    detail: "Doorstep jar delivery",
    price: 4000,
    unit: "jar",
  },
  {
    id: "prd_milk",
    category: "Milk",
    name: "1L Pure Cow Milk",
    detail: "Morning doorstep delivery",
    price: 6500,
    unit: "L",
  },
];

const cadences = [
  { id: "DAILY", label: "Every day" },
  { id: "WEEKDAYS", label: "Mon–Fri" },
  { id: "ALTERNATE_DAYS", label: "Alternate days" },
] as const;

export default function SubscribeClient() {
  const router = useRouter();
  const user = useUser();
  const customerId = user?.id || "";
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [productId, setProductId] = useState(products[0].id);
  const [cadence, setCadence] = useState<"DAILY" | "WEEKDAYS" | "ALTERNATE_DAYS">("DAILY");
  const [quantity, setQuantity] = useState(1);
  const [autopilotDefault, setAutopilotDefault] = useState<"CONFIRMED" | "SKIPPED">("CONFIRMED");

  const product = products.find((item) => item.id === productId) || products[0];

  const fetchSubscriptions = async () => {
    if (!customerId) {
      setSubscriptions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/subscriptions?customerId=" + customerId);
      const data = (await res.json()) as { success: boolean; data?: Subscription[] };
      setSubscriptions(data.success && data.data ? data.data : []);
    } catch (fetchError) {
      console.error(fetchError);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSubscriptions();
  }, [customerId]);

  const handleCreateSubscription = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user) {
      router.push("/login?redirect=/customer/subscribe");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: "ten_sharma_tiffin",
          customerId,
          productId: product.id,
          productName: product.name,
          unitPricePaise: product.price,
          cadence,
          defaultQuantity: Number(quantity),
          autopilotDefault,
          startDate: new Date().toISOString().split("T")[0],
        }),
      });

      const data = (await response.json()) as {
        success: boolean;
        data?: Subscription;
        error?: { message: string };
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to create subscription");
      }

      await fetchSubscriptions();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create subscription");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id: string, action: "pause" | "resume" | "cancel") => {
    try {
      const response = await fetch("/api/subscriptions/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = (await response.json()) as { success: boolean };
      if (data.success) await fetchSubscriptions();
    } catch (actionError) {
      console.error(actionError);
    }
  };

  const monthlyEstimate = useMemo(() => {
    const frequency = cadence === "DAILY" ? 30 : cadence === "WEEKDAYS" ? 22 : 15;
    return (product.price * quantity * frequency) / 100;
  }, [cadence, product.price, quantity]);

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="space-y-6">
        <section className="rounded-[28px] border border-white/[0.08] bg-[radial-gradient(circle_at_top_right,rgba(159,197,143,0.11),transparent_38%),rgba(16,20,18,0.76)] p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em]">
                <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-primary">Recurring services</span>
                <span className="text-subtle">Set once · change only when life changes</span>
              </div>
              <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Build your everyday routine.</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                Choose the service, cadence and quantity you normally want. RUXS keeps the routine moving until you decide to change it.
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4 py-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-subtle">Estimated monthly run-rate</p>
              <p className="mt-1 text-lg font-semibold text-primary">₹{monthlyEstimate.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
          <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Plus size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold">Start a recurring service</p>
                <p className="mt-1 text-xs text-muted-foreground">Your default plan for ordinary days.</p>
              </div>
            </div>

            {error && (
              <div className="mt-5 flex items-start gap-2 rounded-2xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                <CircleAlert size={15} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubscription} className="mt-6 space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-subtle">Choose a service</label>
                  <span className="text-[10px] text-muted-foreground">3 offers</span>
                </div>
                <div className="space-y-2">
                  {products.map((item) => {
                    const selected = item.id === productId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setProductId(item.id)}
                        className={
                          selected
                            ? "flex w-full items-center justify-between rounded-2xl border border-primary/30 bg-primary/[0.07] p-4 text-left"
                            : "flex w-full items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.015] p-4 text-left transition hover:border-white/[0.14] hover:bg-white/[0.03]"
                        }
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className={selected ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary" : "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-subtle"}>
                            <Utensils size={16} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-xs font-semibold">{item.name}</p>
                              <span className="rounded-full border border-white/[0.08] px-1.5 py-0.5 text-[8px] uppercase tracking-[0.12em] text-subtle">{item.category}</span>
                            </div>
                            <p className="mt-1 truncate text-[10px] text-muted-foreground">{item.detail}</p>
                          </div>
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-primary">₹{item.price / 100} / {item.unit}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-subtle">Delivery cadence</label>
                <div className="grid grid-cols-3 gap-2">
                  {cadences.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCadence(item.id)}
                      className={
                        cadence === item.id
                          ? "rounded-xl border border-primary/30 bg-primary/10 px-3 py-2.5 text-xs font-semibold text-primary"
                          : "rounded-xl border border-white/[0.08] bg-white/[0.015] px-3 py-2.5 text-xs text-muted-foreground transition hover:bg-white/[0.04] hover:text-foreground"
                      }
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="rounded-2xl border border-white/[0.08] bg-white/[0.015] p-4">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle">Daily quantity</span>
                  <div className="mt-3 flex items-center gap-2">
                    <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] text-muted-foreground hover:bg-white/[0.04]">−</button>
                    <input value={quantity} onChange={(event) => setQuantity(Math.min(10, Math.max(1, Number(event.target.value) || 1)))} type="number" min="1" max="10" className="h-9 w-full rounded-xl border border-white/[0.08] bg-transparent px-3 text-center text-sm outline-none" />
                    <button type="button" onClick={() => setQuantity(Math.min(10, quantity + 1))} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] text-muted-foreground hover:bg-white/[0.04]">+</button>
                  </div>
                </label>

                <label className="rounded-2xl border border-white/[0.08] bg-white/[0.015] p-4">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle">Autopilot</span>
                  <select value={autopilotDefault} onChange={(event) => setAutopilotDefault(event.target.value as "CONFIRMED" | "SKIPPED")} className="mt-3 h-9 w-full rounded-xl border border-white/[0.08] bg-[#0b0d0c] px-3 text-xs outline-none">
                    <option value="CONFIRMED">Auto-deliver</option>
                    <option value="SKIPPED">Ask before delivery</option>
                  </select>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground transition hover:brightness-105 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RuxsSpinner size="sm" color="text-primary-foreground" />
                    <span>Creating your routine…</span>
                  </>
                ) : (
                  <>
                    <span>{user ? "Start this service" : "Sign in to start"}</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          </section>

          <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.025]">
            <div className="border-b border-white/[0.08] px-5 py-5 sm:px-6">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-subtle">Your routine</p>
                  <h2 className="mt-2 text-xl font-semibold">Recurring services</h2>
                </div>
                <span className="text-xs text-muted-foreground">{subscriptions.length} total</span>
              </div>
            </div>

            {!user ? (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-primary">
                  <Lock size={19} />
                </div>
                <h3 className="mt-4 text-sm font-semibold">Sign in to see your routine</h3>
                <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-muted-foreground">Your saved services live on your RUXS account and stay attached to your household.</p>
                <Link href="/login?redirect=/customer/subscribe" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground">
                  Sign in <ArrowRight size={13} />
                </Link>
              </div>
            ) : loading ? (
              <div className="p-5">
                <RuxsCardListSkeleton count={3} />
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <Sparkles size={22} className="mx-auto text-subtle" />
                <h3 className="mt-4 text-sm font-semibold">Nothing recurring yet</h3>
                <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-muted-foreground">Choose a service on the left and RUXS will carry that default forward.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.07]">
                {subscriptions.map((subscription) => {
                  const active = subscription.status === "ACTIVE";
                  return (
                    <div key={subscription.id} className="px-5 py-5 sm:px-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3.5">
                          <div className={active ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary" : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-subtle"}>
                            <Calendar size={16} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate text-sm font-semibold">{subscription.productName}</h3>
                              <span className={active ? "rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[9px] font-semibold text-primary" : "rounded-full border border-white/[0.08] bg-white/[0.02] px-2 py-0.5 text-[9px] font-semibold text-muted-foreground"}>{subscription.status}</span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {subscription.cadence} · {subscription.defaultQuantity} unit · ₹{(subscription.unitPricePaise / 100).toFixed(0)} / delivery
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 sm:shrink-0">
                          {active ? (
                            <button type="button" onClick={() => handleAction(subscription.id, "pause")} className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/[0.09] px-3 text-[11px] font-semibold text-muted-foreground hover:bg-white/[0.04] hover:text-foreground">
                              <Pause size={13} /> Pause
                            </button>
                          ) : (
                            <button type="button" onClick={() => handleAction(subscription.id, "resume")} className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-3 text-[11px] font-semibold text-primary-foreground">
                              <Play size={13} /> Resume
                            </button>
                          )}
                          <button type="button" onClick={() => handleAction(subscription.id, "cancel")} className="inline-flex h-9 items-center gap-2 rounded-xl border border-destructive/20 px-3 text-[11px] font-semibold text-destructive hover:bg-destructive/10">
                            <X size={13} /> Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <section className="grid gap-3 sm:grid-cols-3">
          {[
            { title: "Flexible by default", detail: "Pause or resume a service without rebuilding the plan.", icon: Pause },
            { title: "Clear billing", detail: "Every fulfilled day rolls into a readable Khata line item.", icon: Receipt },
            { title: "One household", detail: "Services and permissions stay attached to your home.", icon: Users },
          ].map(({ title, detail, icon: Icon }) => (
            <div key={title} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
              <Icon size={16} className="text-primary" />
              <p className="mt-4 text-xs font-semibold">{title}</p>
              <p className="mt-1 text-[10px] leading-5 text-muted-foreground">{detail}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
