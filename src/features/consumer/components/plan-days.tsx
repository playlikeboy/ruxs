"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { endMySubscription, setMyDay } from "@/features/consumer/actions";

export interface PlanDay {
  date: string;
  weekday: string;
  dayNum: string;
  scheduled: boolean;
  skipped: boolean;
  locked: boolean;
}

export function PlanDays({ subscriptionId, days }: { subscriptionId: string; days: PlanDay[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(date: string, kind: "skip" | "deliver") {
    startTransition(async () => {
      const res = await setMyDay({ subscriptionId, serviceDate: date, kind });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(kind === "skip" ? "Skipped — you won't be charged" : "Back on for that day");
      router.refresh();
    });
  }

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
      {days.map((d) => {
        const on = d.scheduled && !d.skipped;
        return (
          <button
            key={d.date}
            type="button"
            disabled={pending || !d.scheduled || d.locked}
            onClick={() => change(d.date, d.skipped ? "deliver" : "skip")}
            aria-label={`${d.weekday} ${d.dayNum}: ${!d.scheduled ? "no delivery" : d.skipped ? "skipped, tap to restore" : "delivering, tap to skip"}`}
            className={
              "flex w-[60px] shrink-0 flex-col items-center rounded-2xl border py-2.5 transition active:scale-95 disabled:active:scale-100 " +
              (!d.scheduled
                ? "border-dashed border-black/10 text-neutral-300"
                : on
                  ? "border-good/30 bg-mint text-good"
                  : "border-bad/20 bg-blush text-bad")
            }
          >
            <span className="text-[11px] font-semibold uppercase">{d.weekday}</span>
            <span className="text-lg font-semibold tabular-nums text-ink">{d.dayNum}</span>
            <span className="text-[10px] font-semibold">{!d.scheduled ? "—" : d.locked ? "Locked" : on ? "On" : "Skip"}</span>
          </button>
        );
      })}
    </div>
  );
}

export function EndPlanButton({ subscriptionId }: { subscriptionId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("End this plan? Deliveries stop after today.")) return;
        startTransition(async () => {
          const res = await endMySubscription({ subscriptionId });
          if (!res.ok) toast.error(res.error);
          else {
            toast.success("Plan ended");
            router.refresh();
          }
        });
      }}
      className="text-sm font-semibold text-neutral-500 underline-offset-4 hover:underline disabled:opacity-60"
    >
      {pending ? "Ending…" : "End plan"}
    </button>
  );
}
