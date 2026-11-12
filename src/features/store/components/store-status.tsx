import { cn } from "@/components/ui/cn";
import { STORE_PAYMENT_STATUS_LABELS } from "@/core/store";
import type { StoreOrderStatus, StorePaymentMode, StorePaymentStatus } from "@/features/store/types";

const TONE: Record<StoreOrderStatus, string> = {
  awaiting_payment: "bg-kids-sunny/60 text-warn",
  placed: "bg-kids-sky/60 text-kids-ink",
  packed: "bg-kids-sky/60 text-kids-ink",
  out_for_delivery: "bg-kids-peach/70 text-kids-ink",
  delivered: "bg-kids-mint/70 text-good",
  cancelled: "bg-bad/10 text-bad",
  returned: "bg-kids-ink/[0.06] text-kids-ink/75",
};

/** Order status as word plus colour. */
export function StoreStatusPill({ status, label, className }: { status: StoreOrderStatus; label: string; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", TONE[status], className)}>{label}</span>;
}

/** "Paid online", "Pay on delivery", "Refund due"… */
export function paymentLine(mode: StorePaymentMode, status: StorePaymentStatus): string {
  if (status === "unpaid") return mode === "cod" ? "Pay on delivery" : "Not paid yet";
  if (status === "paid") return mode === "cod" ? "Paid on delivery" : "Paid online";
  return STORE_PAYMENT_STATUS_LABELS[status];
}
