"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  adminMarkPayoutPaid,
  adminRecordPayout,
  adminRefundShopOrder,
  adminRejectPayout,
  requestWithdrawal,
} from "@/features/payouts/actions";

type Result = { ok: true } | { ok: false; error: string };

function ActionButton({
  label,
  busyLabel,
  className,
  run,
  done,
}: {
  label: string;
  busyLabel: string;
  className: string;
  run: () => Promise<Result | null>;
  done: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className={className + " disabled:opacity-60"}
      onClick={() =>
        startTransition(async () => {
          const res = await run();
          if (!res) return; // cancelled prompt
          if (!res.ok) toast.error(res.error);
          else {
            toast.success(done);
            router.refresh();
          }
        })
      }
    >
      {pending ? busyLabel : label}
    </button>
  );
}

const primary = "h-11 rounded-[10px] bg-accent px-4 text-sm font-bold text-white";
const quiet = "h-9 rounded-[10px] border border-line px-3 text-xs font-semibold text-ink";

export function RequestWithdrawalButton({ slug, label }: { slug: string; label: string }) {
  return (
    <ActionButton
      label={label}
      busyLabel="Requesting…"
      className={primary + " w-full"}
      done="Withdrawal requested. RUXS will transfer it and mark it paid."
      run={async () => (window.confirm("Request a transfer of your full available balance?") ? requestWithdrawal({ slug }) : null)}
    />
  );
}

export function MarkPayoutPaidButton({ payoutId }: { payoutId: string }) {
  return (
    <ActionButton
      label="Mark paid"
      busyLabel="Saving…"
      className="h-9 rounded-[10px] bg-good px-3 text-xs font-bold text-white"
      done="Marked as paid"
      run={async () => {
        const reference = window.prompt("UTR / transfer reference for this payout:");
        return reference === null ? null : adminMarkPayoutPaid({ payoutId, reference });
      }}
    />
  );
}

export function RejectPayoutButton({ payoutId }: { payoutId: string }) {
  return (
    <ActionButton
      label="Reject"
      busyLabel="…"
      className={quiet + " text-bad"}
      done="Request rejected"
      run={async () => {
        const note = window.prompt("Reason (shown to the vendor):");
        return note === null ? null : adminRejectPayout({ payoutId, note });
      }}
    />
  );
}

export function RecordPayoutButton({ vendorId, amountLabel }: { vendorId: string; amountLabel: string }) {
  return (
    <ActionButton
      label={`Pay ${amountLabel}`}
      busyLabel="Saving…"
      className={quiet}
      done="Payout recorded"
      run={async () => {
        const reference = window.prompt(`You sent ${amountLabel}? Enter the UTR / transfer reference:`);
        return reference === null ? null : adminRecordPayout({ vendorId, reference });
      }}
    />
  );
}

export function RefundOrderButton({ orderId, amountLabel }: { orderId: string; amountLabel: string }) {
  return (
    <ActionButton
      label={`Refund ${amountLabel}`}
      busyLabel="Refunding…"
      className={quiet + " text-bad"}
      done="Refund issued through Razorpay"
      run={async () => (window.confirm(`Refund ${amountLabel} to the customer through Razorpay? This cannot be undone.`) ? adminRefundShopOrder({ orderId }) : null)}
    />
  );
}
