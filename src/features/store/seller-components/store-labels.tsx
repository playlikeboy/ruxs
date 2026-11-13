import { Badge } from "@/components/ui/badge";
import { STORE_PAYMENT_STATUS_LABELS, STORE_RETURN_STATUS_LABELS, STORE_STATUS_LABELS } from "@/core/store";
import type {
  AdminCouponState,
  StockKind,
  StoreOrderStatus,
  StorePaymentMode,
  StorePaymentStatus,
  StoreReturnStatus,
  StoreReviewStatus,
  StoreStockReason,
} from "../types";

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

const RETURN_TONE: Record<StoreReturnStatus, Tone> = {
  requested: "accent",
  approved: "info",
  received: "warn",
  refunded: "good",
  rejected: "neutral",
};

const REVIEW: Record<StoreReviewStatus, { tone: Tone; text: string }> = {
  pending: { tone: "warn", text: "Waiting" },
  published: { tone: "good", text: "Published" },
  hidden: { tone: "neutral", text: "Hidden" },
};

const COUPON: Record<AdminCouponState, { tone: Tone; text: string }> = {
  live: { tone: "good", text: "Live" },
  scheduled: { tone: "info", text: "Scheduled" },
  expired: { tone: "neutral", text: "Expired" },
  used_up: { tone: "warn", text: "Used up" },
  off: { tone: "neutral", text: "Off" },
};

export const STOCK_REASON_LABELS: Record<StoreStockReason, string> = {
  restock: "Restock",
  order: "Order",
  cancel: "Order cancelled",
  adjust: "Correction",
  return: "Return",
};

/** What the packing team calls each order status. "placed" reads as "New". */
export function orderStatusText(status: StoreOrderStatus): string {
  return status === "placed" ? "New" : STORE_STATUS_LABELS[status];
}

/** Order status as word + colour. */
export function StoreStatusBadge({ status }: { status: StoreOrderStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{orderStatusText(status)}</Badge>;
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
  return (
    <Badge tone={STOCK_TONE[kind]} className="tabular-nums">
      {label}
    </Badge>
  );
}

export function ReturnBadge({ status }: { status: StoreReturnStatus }) {
  return <Badge tone={RETURN_TONE[status]}>{STORE_RETURN_STATUS_LABELS[status]}</Badge>;
}

export function ReviewBadge({ status }: { status: StoreReviewStatus }) {
  return <Badge tone={REVIEW[status].tone}>{REVIEW[status].text}</Badge>;
}

export function CouponStateBadge({ state }: { state: AdminCouponState }) {
  return <Badge tone={COUPON[state].tone}>{COUPON[state].text}</Badge>;
}

/** Live / Hidden / Archived for a product. */
export function ProductStateBadge({ isActive, archivedAt }: { isActive: boolean; archivedAt: Date | null }) {
  if (archivedAt) return <Badge tone="neutral">Archived</Badge>;
  return isActive ? <Badge tone="good">Live</Badge> : <Badge tone="warn">Hidden</Badge>;
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

/** `datetime-local` value in India time, and back to an ISO instant. */
export function istInputValue(d: Date | string | null): string {
  return d ? new Date(new Date(d).getTime() + 330 * 60_000).toISOString().slice(0, 16) : "";
}

export function istInputToIso(v: string): string | null {
  return v ? new Date(`${v}:00+05:30`).toISOString() : null;
}
