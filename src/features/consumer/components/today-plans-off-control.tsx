"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarCheck, CalendarX2, Clock, Lock, Power } from "lucide-react";
import { AppIcon } from "@/components/ui/app-icon";
import { setMyDay, skipAllToday } from "@/features/consumer/actions";

export interface ScheduledTodayPlan {
  subscriptionId: string;
  productName: string;
  vendorName: string;
  kind: string;
  qty: number;
  unit: string;
  cutoffAt: string;
  skipped: boolean;
  locked: boolean;
}

export function TodayPlansOffControl({
  items,
  today,
}: {
  items: ScheduledTodayPlan[];
  today: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="mx-4 mt-4 rounded-2xl border border-line bg-surface p-4 text-xs text-muted">
        <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
          <CalendarCheck className="h-4 w-4 text-good" aria-hidden="true" /> No deliveries scheduled for today
        </p>
        <p className="mt-0.5">Your active subscriptions deliver on their scheduled days.</p>
      </div>
    );
  }

  const openItems = items.filter((i) => !i.locked);
  const receivingCount = items.filter((i) => !i.skipped).length;
  const allSkipped = receivingCount === 0;

  const handleToggleSingle = (item: ScheduledTodayPlan) => {
    if (item.locked) {
      toast.error(`The cutoff time (${item.cutoffAt}) has passed for today`);
      return;
    }

    setBusyId(item.subscriptionId);
    startTransition(async () => {
      const res = await setMyDay({
        subscriptionId: item.subscriptionId,
        serviceDate: today,
        kind: item.skipped ? "deliver" : "skip",
      });
      setBusyId(null);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        item.skipped
          ? `${item.productName} is back on for today`
          : `Skipped today. ${item.vendorName} has been told.`
      );
      router.refresh();
    });
  };

  const handleSkipAll = () => {
    if (openItems.length === 0) {
      toast.error("All cutoffs for today have already passed");
      return;
    }

    if (!window.confirm("Skip all remaining deliveries for today? Each vendor is told immediately.")) {
      return;
    }

    startTransition(async () => {
      const res = await skipAllToday();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        res.skipped
          ? `Skipped ${res.skipped} for today. Stores have been told.` + (res.locked ? ` ${res.locked} already past cutoff.` : "")
          : "Nothing left to skip today"
      );
      router.refresh();
    });
  };

  return (
    <section className="mx-4 mt-4 overflow-hidden rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3 border-b border-line pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-peach text-accent">
              <Power className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-[15px] font-bold text-ink">Today&apos;s deliveries</h2>
              <p className="text-xs text-muted">
                {allSkipped
                  ? "You're off today. No deliveries."
                  : `${receivingCount} of ${items.length} coming today`}
              </p>
            </div>
          </div>
        </div>

        {openItems.length > 1 && !allSkipped && (
          <button
            type="button"
            disabled={pending}
            onClick={handleSkipAll}
            className="inline-flex h-10 shrink-0 items-center gap-1 rounded-xl bg-ink px-3 text-xs font-semibold text-white hover:bg-ink/90 active:scale-95 disabled:opacity-50"
          >
            <CalendarX2 className="h-3.5 w-3.5" aria-hidden="true" /> Skip all today
          </button>
        )}
      </div>

      <div className="mt-3 divide-y divide-line">
        {items.map((item) => {
          const isBusy = busyId === item.subscriptionId;

          return (
            <div
              key={item.subscriptionId}
              className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-2xl shrink-0" aria-hidden="true">
                  <AppIcon name={item.kind} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {item.productName}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {item.vendorName} · {item.qty} {item.unit}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    Cutoff: {item.cutoffAt} IST
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {item.locked ? (
                  <span className="flex items-center gap-1 rounded-full bg-app-canvas px-2.5 py-1 text-xs font-medium text-muted">
                    <Lock className="h-3 w-3" aria-hidden="true" /> {item.skipped ? "Off · locked" : "Coming · locked"}
                  </span>
                ) : item.skipped ? (
                  <button
                    type="button"
                    disabled={pending || isBusy}
                    onClick={() => handleToggleSingle(item)}
                    aria-label={`${item.productName} is off today. Resume delivery`}
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-line bg-app-canvas px-3 text-xs font-semibold text-ink hover:bg-line/60 active:scale-95 disabled:opacity-50"
                  >
                    Off today <span className="font-bold text-accent underline">Resume</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={pending || isBusy}
                    onClick={() => handleToggleSingle(item)}
                    aria-label={`${item.productName} is coming today. Skip today`}
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-bad/20 bg-bad/5 px-3 text-xs font-semibold text-bad hover:bg-bad/10 active:scale-95 disabled:opacity-50"
                  >
                    <CalendarX2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Skip today</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
