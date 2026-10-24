"use client";

import { AppIcon } from "@/components/ui/app-icon";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarCheck, Lock } from "lucide-react";
import { setMyDay, skipAllToday } from "@/features/consumer/actions";

export interface TodayItem {
  subscriptionId: string;
  kind: string;
  productName: string;
  vendorName: string;
  qty: number;
  unit: string;
  cutoffAt: string;
  skipped: boolean;
  locked: boolean;
}

/** Today's plan deliveries with a one-tap "receive today?" switch for each. */
export function TodayCard({ items, today }: { items: TodayItem[]; today: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const open = items.filter((i) => !i.locked && !i.skipped);
  const receiving = items.filter((i) => !i.skipped).length;

  function toggle(item: TodayItem) {
    setBusyId(item.subscriptionId);
    startTransition(async () => {
      const res = await setMyDay({ subscriptionId: item.subscriptionId, serviceDate: today, kind: item.skipped ? "deliver" : "skip" });
      setBusyId(null);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(item.skipped ? `${item.productName} is back on for today` : `Skipped today. ${item.vendorName} has been told.`);
      router.refresh();
    });
  }

  return (
    <section className="rounded-3xl border border-black/5 bg-white p-4 shadow-[0_6px_24px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-accent">
            <CalendarCheck className="h-4 w-4" aria-hidden="true" /> Today&apos;s deliveries
          </p>
          <p className="mt-0.5 text-sm text-neutral-500">
            {receiving === 0 ? "You're off today. No deliveries." : `${receiving} of ${items.length} coming today`}
          </p>
        </div>
        {open.length > 1 && (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!window.confirm("Skip all of today's deliveries? Each store is told right away.")) return;
              startTransition(async () => {
                const res = await skipAllToday();
                if (res.ok) {
                  toast.success(
                    res.skipped
                      ? `Skipped ${res.skipped} for today. Stores have been told.` + (res.locked ? ` ${res.locked} already past cutoff.` : "")
                      : "Nothing left to skip today"
                  );
                  router.refresh();
                }
              });
            }}
            className="h-9 shrink-0 rounded-full border border-black/10 px-3 text-xs font-semibold text-ink disabled:opacity-60"
          >
            I&apos;m off today
          </button>
        )}
      </div>

      <ul className="mt-3 divide-y divide-black/5">
        {items.map((item) => {
          const on = !item.skipped;
          return (
            <li key={item.subscriptionId} className="flex items-center gap-3 py-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-50 text-accent" aria-hidden="true"><AppIcon name={item.kind} /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-ink">
                  {item.qty} × {item.productName}
                </p>
                <p className="truncate text-xs text-neutral-500">
                  {item.vendorName} ·{" "}
                  {item.locked ? (
                    <span className="inline-flex items-center gap-0.5"><Lock className="h-3 w-3" aria-hidden="true" /> changes closed at {item.cutoffAt}</span>
                  ) : (
                    `change until ${item.cutoffAt}`
                  )}
                </p>
              </div>
              <label className={"flex shrink-0 items-center gap-2 text-xs font-semibold " + (item.locked ? "opacity-50" : "cursor-pointer")}>
                <span className={on ? "text-good" : "text-bad"}>{on ? "Receive" : "Skip"}</span>
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={on}
                  disabled={item.locked || (pending && busyId === item.subscriptionId)}
                  onChange={() => toggle(item)}
                  aria-label={`Receive ${item.productName} today`}
                />
                <span className="relative h-7 w-12 rounded-full bg-neutral-300 transition peer-checked:bg-good after:absolute after:left-0.5 after:top-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" aria-hidden="true" />
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
