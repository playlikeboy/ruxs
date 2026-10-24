"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { providerKidsBookingAction } from "@/features/kids/actions";

type Action = "accept" | "decline" | "completed" | "cancelled";

const DONE_TOAST: Record<Action, string> = {
  accept: "Booking accepted. The parent can see it is confirmed.",
  decline: "Request declined",
  completed: "Marked done",
  cancelled: "Session cancelled",
};

/**
 * Provider controls for one kids session, keyed off the calendar status:
 * requested → Accept / Decline, confirmed → Done (after start) or Cancel (before).
 */
export function KidsBookingActions({ slug, bookingId, status, started }: { slug: string; bookingId: string; status: string; started: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = (action: Action) => {
    let reason: string | undefined;
    if (action === "decline" || action === "cancelled") {
      const r = window.prompt(action === "decline" ? "Reason for declining (shown to the parent):" : "Reason for cancelling (shown to the parent):");
      if (r === null) return;
      reason = r.trim() || undefined;
    }
    startTransition(async () => {
      const res = await providerKidsBookingAction({ slug, bookingId, action, reason });
      if (!res.ok) toast.error(res.error);
      else {
        toast.success(DONE_TOAST[action]);
        router.refresh();
      }
    });
  };

  const btn = "h-9 rounded-[10px] px-3 text-xs font-semibold disabled:opacity-60";
  if (status === "requested") {
    return (
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={pending} onClick={() => run("accept")} className={`${btn} bg-good font-bold text-white`}>Accept</button>
        <button type="button" disabled={pending} onClick={() => run("decline")} className={`${btn} border border-line text-bad`}>Decline</button>
      </div>
    );
  }
  if (status !== "confirmed") return null;
  return started ? (
    <button type="button" disabled={pending} onClick={() => run("completed")} className={`${btn} bg-good font-bold text-white`}>Done</button>
  ) : (
    <button type="button" disabled={pending} onClick={() => run("cancelled")} className={`${btn} border border-line text-bad`}>Cancel</button>
  );
}
