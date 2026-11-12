import { Badge } from "@/components/ui/badge";
import { STORE_PAYMENT_STATUS_LABELS, STORE_STATUS_LABELS } from "@/core/store";
import type { StockKind, StoreOrderStatus, StorePaymentMode, StorePaymentStatus } from "../types";

type Tone = "neutral" | "accent" | "good" | "warn" | "bad" | "info";

const STATUS_TONE: Record<StoreOrderStatus, Tone> = {
  awaiting_payment: "warn",
  placed: "accent",
  packed: "info",
  out_for_delivery: "info",
  delivered: "good",
  cancelled: "neutral",
  returned: "neutral",
};

const PAYMENT_TONE: Record<StorePaymentStatus, Tone> = {
  unpaid: "warn",
  paid: "good",
  refund_due: "bad",
  refunded: "neutral",
};

const STOCK_TONE: Record<StockKind, Tone> = { out: "bad", low: "warn", in: "good" };

/** Order status as word + colour. "placed" reads as "New" to the team packing orders. */
export function StoreStatusBadge({ status }: { status: StoreOrderStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{status === "placed" ? "New" : STORE_STATUS_LABELS[status]}</Badge>;
}

export function StorePaymentBadge({ status, mode }: { status: StorePaymentStatus; mode: StorePaymentMode }) {
  return (
    <Badge tone={PAYMENT_TONE[status]}>
      {mode === "cod" ? "COD" : "Online"} · {STORE_PAYMENT_STATUS_LABELS[status]}
    </Badge>
  );
}

export function StockBadge({ kind, stock }: { kind: StockKind; stock: number }) {
  const label = kind === "out" ? "Out of stock" : kind === "low" ? `Low · ${stock} left` : `${stock} in stock`;
  return <Badge tone={STOCK_TONE[kind]} className="tabular-nums">{label}</Badge>;
}

const DATE_TIME: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" };
const DATE_ONLY: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" };

/** India time, e.g. "12 Nov, 4:05 pm". */
export function istDateTime(d: Date | string | null): string {
  return d ? new Date(d).toLocaleString("en-IN", DATE_TIME) : "—";
}

export function istDate(d: Date | string | null): string {
  return d ? new Date(d).toLocaleDateString("en-IN", DATE_ONLY) : "—";
}

/** Rupee text for a money input ("" for null). Integer paise in, display string out. */
export function paiseToInput(paise: number | null | undefined): string {
  if (paise == null) return "";
  return paise % 100 === 0 ? String(paise / 100) : (paise / 100).toFixed(2);
}
