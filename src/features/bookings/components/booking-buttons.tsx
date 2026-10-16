"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cancelMyBooking, markBooking } from "@/features/bookings/actions";

export function CancelBookingButton({ bookingId, className = "" }: { bookingId: string; className?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Cancel this session? If you paid online, the refund goes back to you.")) return;
        startTransition(async () => {
          const res = await cancelMyBooking({ bookingId });
          if (!res.ok) toast.error(res.error);
          else {
            toast.success("Session cancelled");
            router.refresh();
          }
        });
      }}
      className={"font-semibold text-bad disabled:opacity-60 " + className}
    >
      {pending ? "Cancelling…" : "Cancel session"}
    </button>
  );
}

/** Provider closes a session after it starts, or cancels it before. */
export function SessionActions({ slug, bookingId, started }: { slug: string; bookingId: string; started: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const run = (outcome: "done" | "no_show" | "cancelled") => {
    let reason: string | undefined;
    if (outcome === "cancelled") {
      const r = window.prompt("Reason for cancelling (shown to the client):");
      if (r === null) return;
      reason = r || undefined;
    }
    startTransition(async () => {
      const res = await markBooking({ slug, bookingId, outcome, reason });
      if (!res.ok) toast.error(res.error);
      else {
        toast.success(outcome === "done" ? "Marked done" : outcome === "no_show" ? "Marked no-show" : "Session cancelled");
        router.refresh();
      }
    });
  };
  return (
    <div className="flex flex-wrap gap-2">
      {started ? (
        <>
          <button type="button" disabled={pending} onClick={() => run("done")} className="h-9 rounded-[10px] bg-good px-3 text-xs font-bold text-white disabled:opacity-60">Done</button>
          <button type="button" disabled={pending} onClick={() => run("no_show")} className="h-9 rounded-[10px] border border-line px-3 text-xs font-semibold disabled:opacity-60">No-show</button>
        </>
      ) : (
        <button type="button" disabled={pending} onClick={() => run("cancelled")} className="h-9 rounded-[10px] border border-line px-3 text-xs font-semibold text-bad disabled:opacity-60">Cancel</button>
      )}
    </div>
  );
}
