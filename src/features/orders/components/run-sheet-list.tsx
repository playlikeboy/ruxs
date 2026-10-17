"use client";

import { useState, useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { markDelivered, markFailed } from "@/features/orders/actions";
import { QtyStepper } from "./qty-stepper";

interface Stop {
  order: {
    id: string;
    qty: number;
    status: string;
    deliveredAt: Date | null;
    failedReason: string | null;
  };
  customer: {
    id: string;
    name: string;
    phone: string;
    society: string;
    tower: string;
    floor: string;
    flat: string;
  };
  product: {
    id: string;
    name: string;
    assetName: string | null;
  };
  latitude?: number | null;
  longitude?: number | null;
}

export function RunSheetList({
  stops: initialStops,
  slug,
}: {
  stops: Stop[];
  slug: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStops, setOptimisticStops] = useOptimistic(
    initialStops,
    (state, update: { id: string; status: string; reason?: string }) =>
      state.map((s) =>
        s.order.id === update.id
          ? {
              ...s,
              order: {
                ...s.order,
                status: update.status,
                failedReason: update.reason ?? null,
              },
            }
          : s
      )
  );

  const [expandedId, setExpandedId] = useState<string | null>(
    optimisticStops.find((s) => s.order.status === "confirmed")?.order.id ??
      null
  );

  const [steppers, setSteppers] = useState<
    Record<string, { cansOut: number; cansIn: number }>
  >({});

  const getStepper = (id: string, hasAsset: boolean) => {
    return (
      steppers[id] ?? {
        cansOut: hasAsset ? 1 : 0,
        cansIn: hasAsset ? 1 : 0,
      }
    );
  };

  const handleDeliver = (stop: Stop) => {
    const sState = getStepper(stop.order.id, !!stop.product.assetName);

    startTransition(async () => {
      setOptimisticStops({ id: stop.order.id, status: "delivered" });

      const res = await markDelivered({
        slug,
        orderId: stop.order.id,
        cansOut: sState.cansOut,
        cansIn: sState.cansIn,
      });

      if (!res.ok) {
        const errorMsg = "error" in res && typeof res.error === "string" ? res.error : "Failed to mark delivered";
        toast.error(errorMsg);
      } else {
        toast.success(`Delivered to ${stop.customer.name} (Flat ${stop.customer.flat})`);
        // Expand next pending stop
        const nextPending = optimisticStops.find(
          (s) => s.order.id !== stop.order.id && s.order.status === "confirmed"
        );
        if (nextPending) setExpandedId(nextPending.order.id);
      }
    });
  };

  const handleFail = (stop: Stop) => {
    const reason = window.prompt("Reason for failed delivery (e.g. Door locked):");
    if (!reason) return;

    startTransition(async () => {
      setOptimisticStops({ id: stop.order.id, status: "failed", reason });

      const res = await markFailed({
        slug,
        orderId: stop.order.id,
        reason,
      });

      if (!res.ok) {
        toast.error(res.error ?? "Failed to mark as failed");
      } else {
        toast.error(`Marked failed: ${reason}`);
      }
    });
  };

  const pendingStops = optimisticStops.filter(
    (s) => s.order.status === "confirmed"
  );
  const deliveredStops = optimisticStops.filter(
    (s) => s.order.status === "delivered"
  );

  return (
    <div className="space-y-4">
      {/* Sticky Progress Header */}
      <div className="sticky top-[57px] z-20 bg-surface/95 backdrop-blur-md border border-line rounded-[12px] p-3 flex items-center justify-between shadow-xs">
        <div>
          <span className="text-xs text-muted">Stops remaining</span>
          <div className="text-lg font-bold text-ink tabular-nums">
            {pendingStops.length} of {optimisticStops.length} left
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-good font-semibold tabular-nums">
            {deliveredStops.length} Delivered
          </span>
        </div>
      </div>

      {/* Stop Cards */}
      <div className="space-y-3">
        {optimisticStops.map((stop) => {
          const isExpanded = expandedId === stop.order.id;
          const isDone = stop.order.status === "delivered";
          const isFailed = stop.order.status === "failed";
          const hasAsset = !!stop.product.assetName;
          const sState = getStepper(stop.order.id, hasAsset);

          return (
            <div
              key={stop.order.id}
              className={`bg-surface border rounded-[12px] transition-all overflow-hidden ${
                isDone
                  ? "border-line opacity-75"
                  : isFailed
                    ? "border-[#B42318]/30 bg-[#FFF5F5]"
                    : isExpanded
                      ? "border-accent shadow-xs"
                      : "border-line"
              }`}
            >
              {/* Header row */}
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : stop.order.id)}
                className="w-full p-4 flex items-start justify-between text-left"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-ink font-mono tabular-nums">
                      Flat {stop.customer.flat}
                    </span>
                    <span className="text-xs text-muted">
                      {stop.customer.tower ? `Tower ${stop.customer.tower}` : ""}{" "}
                      (Fl {stop.customer.floor})
                    </span>
                  </div>

                  <div className="text-sm font-medium text-ink mt-0.5">
                    {stop.customer.name}
                  </div>

                  <div className="text-xs text-muted mt-0.5">
                    {stop.customer.society} • {stop.product.name} (x{stop.order.qty})
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isDone ? (
                    <span className="px-2.5 py-1 bg-[#E1F3E7] text-good text-xs font-semibold rounded-full flex items-center gap-1">
                      ✓ Delivered
                    </span>
                  ) : isFailed ? (
                    <span className="px-2.5 py-1 bg-[#FCE4EC] text-[#B42318] text-xs font-semibold rounded-full">
                      Failed
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-[#FAFAF7] text-muted text-xs font-medium rounded-full border border-line">
                      Pending
                    </span>
                  )}
                </div>
              </button>

              {/* Expanded Action Panel */}
              {isExpanded && !isDone && !isFailed && (
                <div className="p-4 pt-0 space-y-4 border-t border-line/60 bg-[#FAFAF7]/50">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-3">
                    <a
                      href={`tel:${stop.customer.phone}`}
                      className="inline-flex items-center gap-1 text-accent font-medium hover:underline"
                    >
                      📞 Call {stop.customer.phone}
                    </a>
                    <a
                      href={stop.latitude && stop.longitude
                        ? `https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}`
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${stop.customer.flat}, ${stop.customer.society}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-md bg-white border border-line px-2 py-0.5 text-[11px] font-semibold text-accent hover:border-accent shadow-2xs transition active:scale-95"
                    >
                      🗺️ Open Maps ↗
                    </a>
                  </div>

                  {/* Asset Stepper for cans or dabbas */}
                  {hasAsset && (
                    <div className="space-y-2">
                      <QtyStepper
                        label={`${stop.product.assetName} Given Out`}
                        value={sState.cansOut}
                        onChange={(val) =>
                          setSteppers((prev) => ({
                            ...prev,
                            [stop.order.id]: { ...sState, cansOut: val },
                          }))
                        }
                      />
                      <QtyStepper
                        label={`Empty ${stop.product.assetName} Collected`}
                        value={sState.cansIn}
                        onChange={(val) =>
                          setSteppers((prev) => ({
                            ...prev,
                            [stop.order.id]: { ...sState, cansIn: val },
                          }))
                        }
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDeliver(stop)}
                      className="flex-1 min-h-[48px] py-3 px-4 bg-good text-white font-semibold text-sm rounded-[10px] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <span>Mark Delivered</span>
                    </button>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleFail(stop)}
                      className="min-h-[48px] py-3 px-3 bg-surface border border-line text-muted font-medium text-xs rounded-[10px] hover:text-[#B42318] hover:border-[#B42318]/40 active:scale-98 transition-all"
                    >
                      Failed
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
