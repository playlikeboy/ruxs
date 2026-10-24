"use client";

import { AppIcon } from "@/components/ui/app-icon";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarCheck, CalendarX2, Check, Clock, Lock, Power } from "lucide-react";
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
      <div className="mx-4 mt-4 rounded-2xl border border-black/5 bg-white p-4 text-xs text-neutral-500 shadow-xs">
        <p className="flex items-center gap-1.5 font-medium text-neutral-700">
          <CalendarCheck className="h-4 w-4 text-good" /> No deliveries scheduled for today
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
          ? `${item.productName} is back ON for today!`
          : `Turned OFF for today. ${item.vendorName} has been notified.`
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
      toast.success(`You're off today! Skipped ${res.skipped} deliveries.`);
      router.refresh();
    });
  };

  return (
    <section className="mx-4 mt-4 overflow-hidden rounded-3xl border border-black/10 bg-white p-4.5 shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-black/5 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-peach text-accent">
              <Power className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-[15px] font-bold text-ink">Today&apos;s Deliveries &amp; Skip Controls</h2>
              <p className="text-xs text-neutral-500">
                {allSkipped
                  ? "You are OFF for today. No deliveries coming."
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
            className="inline-flex h-8 items-center gap-1 rounded-xl bg-ink px-3 text-xs font-semibold text-white shadow-xs hover:bg-neutral-800 active:scale-95 disabled:opacity-50"
          >
            <CalendarX2 className="h-3.5 w-3.5" /> Skip all today
          </button>
        )}
      </div>

      <div className="mt-3.5 divide-y divide-black/5">
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
                  <p className="truncate text-xs text-neutral-500">
                    {item.vendorName} · {item.qty} {item.unit}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-neutral-400">
                    <Clock className="h-3 w-3" />
                    Cutoff: {item.cutoffAt} IST
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {item.locked ? (
                  <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-400">
                    <Lock className="h-3 w-3" /> Locked
                  </span>
                ) : item.skipped ? (
                  <button
                    type="button"
                    disabled={pending || isBusy}
                    onClick={() => handleToggleSingle(item)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-black/10 bg-neutral-100 px-3 text-xs font-semibold text-neutral-700 hover:bg-neutral-200 active:scale-95 disabled:opacity-50"
                  >
                    Off today <span className="text-accent underline font-bold">Resume</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={pending || isBusy}
                    onClick={() => handleToggleSingle(item)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-bad/20 bg-blush px-3 text-xs font-semibold text-bad hover:bg-red-100 active:scale-95 disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5 text-good" />
                    <span>Off today?</span>
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
