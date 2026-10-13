"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setDayChange } from "@/features/day-changes/actions";

interface SubscriptionInfo {
  id: string;
  qty: number;
  days: string[];
  productName: string;
  cutoffAt: string;
}

interface DayChangeRecord {
  subscriptionId: string;
  serviceDate: string;
  kind: string;
  qty: number;
  isLate: boolean;
}

interface DayCardProps {
  token: string;
  todayStr: string;
  days: {
    dateStr: string;
    dayLabel: string;
    dayNum: string;
    weekday: string;
    isToday: boolean;
  }[];
  subscription: SubscriptionInfo;
  initialChanges: DayChangeRecord[];
}

export function CustomerDayCards({
  token,
  days,
  subscription,
  initialChanges,
}: DayCardProps) {
  const [isPending, startTransition] = useTransition();
  const [changes, setChanges] = useState<Record<string, { kind: string; qty: number }>>(() => {
    const map: Record<string, { kind: string; qty: number }> = {};
    for (const c of initialChanges) {
      if (c.subscriptionId === subscription.id) {
        map[c.serviceDate] = { kind: c.kind, qty: c.qty };
      }
    }
    return map;
  });

  const handleAction = (dateStr: string, kind: "skip" | "extra" | "qty", qty = 0) => {
    // Optimistic update
    setChanges((prev) => ({
      ...prev,
      [dateStr]: { kind, qty },
    }));

    startTransition(async () => {
      const res = await setDayChange({
        token,
        subscriptionId: subscription.id,
        serviceDate: dateStr,
        kind,
        qty,
      });

      if (!res.ok) {
        toast.error(res.error ?? "Failed to update day");
      } else {
        if (res.isLate) {
          toast.info("Cutoff passed. Late policy applied to order.");
        } else {
          toast.success(
            kind === "skip"
              ? "Day skipped"
              : kind === "extra"
                ? "Extra meal added"
                : "Scheduled delivery set"
          );
        }
      }
    });
  };

  return (
    <div className="space-y-3">
      {days.map((day) => {
        const isScheduled = subscription.days.includes(day.weekday);
        const change = changes[day.dateStr];
        const currentKind = change?.kind ?? (isScheduled ? "deliver" : "skip");

        return (
          <div
            key={day.dateStr}
            className={`p-4 bg-surface border rounded-[12px] space-y-3 transition-all shadow-xs ${
              day.isToday ? "border-accent ring-1 ring-accent/30" : "border-line"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-[10px] flex flex-col items-center justify-center font-bold font-mono leading-none ${
                    day.isToday
                      ? "bg-accent text-white"
                      : "bg-[#FAFAF7] text-ink border border-line"
                  }`}
                >
                  <span className="text-[10px] uppercase font-sans font-medium">
                    {day.dayLabel}
                  </span>
                  <span className="text-sm">{day.dayNum}</span>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-ink">
                      {day.isToday ? "Today" : `${day.dayLabel}, ${day.dayNum}`}
                    </span>
                    {day.isToday && (
                      <span className="px-2 py-0.5 bg-[#FFE8DD] text-accent text-[10px] font-bold rounded-full">
                        Cutoff {subscription.cutoffAt}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted block mt-0.5">
                    {currentKind === "skip"
                      ? "Skipped (No delivery)"
                      : currentKind === "extra"
                        ? `Extra delivery (+${change?.qty ?? 1})`
                        : isScheduled
                          ? `Delivering ${subscription.qty} meal`
                          : "Delivering meal"}
                  </span>
                </div>
              </div>
            </div>

            {/* Tap Actions: Deliver / Skip / Extra */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleAction(day.dateStr, "qty", subscription.qty)}
                className={`py-2 px-2 text-xs font-semibold rounded-[8px] border transition-all active:scale-95 ${
                  currentKind !== "skip" && currentKind !== "extra"
                    ? "bg-good text-white border-good shadow-xs"
                    : "bg-[#FAFAF7] text-muted border-line hover:bg-white"
                }`}
              >
                ✓ Deliver
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={() => handleAction(day.dateStr, "skip", 0)}
                className={`py-2 px-2 text-xs font-semibold rounded-[8px] border transition-all active:scale-95 ${
                  currentKind === "skip"
                    ? "bg-[#1C1B19] text-white border-ink shadow-xs"
                    : "bg-[#FAFAF7] text-muted border-line hover:bg-white"
                }`}
              >
                ✕ Skip
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={() => handleAction(day.dateStr, "extra", 1)}
                className={`py-2 px-2 text-xs font-semibold rounded-[8px] border transition-all active:scale-95 ${
                  currentKind === "extra"
                    ? "bg-accent text-white border-accent shadow-xs"
                    : "bg-[#FAFAF7] text-muted border-line hover:bg-white"
                }`}
              >
                + Extra
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
