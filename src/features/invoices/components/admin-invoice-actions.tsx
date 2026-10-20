"use client";

import { useTransition } from "react";
import { CheckCircle2, RefreshCw, Printer } from "lucide-react";
import { toast } from "sonner";
import { markAdminInvoicePaid, regenerateAdminInvoice } from "../actions";

export function MarkPaidButton({
  invoiceId,
  isPaid,
}: {
  invoiceId: string;
  isPaid: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (isPaid) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-good">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        Paid
      </span>
    );
  }

  const handleMarkPaid = () => {
    if (!confirm("Are you sure you want to mark this invoice as fully paid? This will record a balancing payment entry.")) {
      return;
    }
    startTransition(async () => {
      const res = await markAdminInvoicePaid({ invoiceId });
      if (res.ok) {
        toast.success("Invoice marked as paid!");
      } else {
        toast.error(res.error || "Failed to mark invoice as paid");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleMarkPaid}
      disabled={pending}
      className="inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-good px-2.5 text-xs font-semibold text-white shadow-2xs transition hover:opacity-90 disabled:opacity-50"
    >
      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{pending ? "Updating…" : "Mark Paid"}</span>
    </button>
  );
}

export function RegenerateInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const [pending, startTransition] = useTransition();

  const handleRegenerate = () => {
    startTransition(async () => {
      const res = await regenerateAdminInvoice({ invoiceId });
      if (res.ok) {
        toast.success("Invoice recomputed from ledger successfully!");
      } else {
        toast.error(res.error || "Failed to regenerate invoice");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleRegenerate}
      disabled={pending}
      className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-line bg-surface px-2.5 text-xs font-medium text-ink transition hover:bg-bg disabled:opacity-50"
      title="Recalculate balances from the ledger"
    >
      <RefreshCw className={"h-3.5 w-3.5 text-muted " + (pending ? "animate-spin" : "")} aria-hidden="true" />
      <span>{pending ? "Recalculating…" : "Recalculate"}</span>
    </button>
  );
}

export function PrintInvoiceButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-line bg-surface px-3 text-xs font-semibold text-ink shadow-2xs transition hover:bg-bg"
    >
      <Printer className="h-4 w-4 text-muted" aria-hidden="true" />
      <span>Print / PDF</span>
    </button>
  );
}
