/**
 * Pure rules for the RUXs Store (first-party kids shop). No database, no I/O.
 * Money is integer paise throughout.
 */
import { isWithinGeofence, type Coordinates } from "./geo";
import { todayIST } from "./time";

export const STORE_ORDER_STATUSES = [
  "awaiting_payment",
  "placed",
  "packed",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
] as const;
export type StoreOrderStatus = (typeof STORE_ORDER_STATUSES)[number];

export const STORE_PAYMENT_MODES = ["online", "cod"] as const;
export type StorePaymentMode = (typeof STORE_PAYMENT_MODES)[number];

export const STORE_PAYMENT_STATUSES = ["unpaid", "paid", "refund_due", "refunded"] as const;
export type StorePaymentStatus = (typeof STORE_PAYMENT_STATUSES)[number];

export type StoreActor = "customer" | "admin" | "system";

export const STORE_STOCK_REASONS = ["restock", "order", "cancel", "adjust"] as const;
export type StoreStockReason = (typeof STORE_STOCK_REASONS)[number];

/** Orders still being worked on (not finished, not abandoned). */
export const STORE_OPEN_STATUSES: readonly StoreOrderStatus[] = ["placed", "packed", "out_for_delivery"];

/** Unpaid online orders hold their stock this long, then the cron tick releases it. */
export const STORE_PAYMENT_HOLD_MINUTES = 30;
/** Most of one product a household can buy in one order. */
export const STORE_MAX_LINE_QTY = 10;
/** Most distinct products in one bag. */
export const STORE_MAX_LINES = 30;
export const STORE_MAX_IMAGES = 6;

export const STORE_STATUS_LABELS: Record<StoreOrderStatus, string> = {
  awaiting_payment: "Awaiting payment",
  placed: "Placed",
  packed: "Packed",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

export const STORE_PAYMENT_STATUS_LABELS: Record<StorePaymentStatus, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
  refund_due: "Refund due",
  refunded: "Refunded",
};

/** The happy path shown as a timeline (cancelled/returned are shown separately). */
export const STORE_TIMELINE: readonly StoreOrderStatus[] = ["placed", "packed", "out_for_delivery", "delivered"];

export function isStoreOrderStatus(v: string): v is StoreOrderStatus {
  return (STORE_ORDER_STATUSES as readonly string[]).includes(v);
}

export interface StoreFeeSettings {
  deliveryFeePaise: number;
  /** Free delivery when the subtotal reaches this; null = never free. */
  freeDeliveryAbovePaise: number | null;
}

export interface StoreCartTotals {
  subtotalPaise: number;
  deliveryFeePaise: number;
  totalPaise: number;
  itemCount: number;
  /** How much more to add for free delivery; null when already free or never free. */
  freeDeliveryGapPaise: number | null;
}

/** Subtotal, delivery fee (free above the threshold) and total. An empty bag costs nothing. */
export function storeCartTotals(
  items: { unitPricePaise: number; qty: number }[],
  settings: StoreFeeSettings
): StoreCartTotals {
  let subtotalPaise = 0;
  let itemCount = 0;
  for (const i of items) {
    if (!Number.isInteger(i.unitPricePaise) || !Number.isInteger(i.qty) || i.qty <= 0 || i.unitPricePaise < 0) {
      throw new Error("Store cart lines must be positive integer qty and integer paise");
    }
    subtotalPaise += i.unitPricePaise * i.qty;
    itemCount += i.qty;
  }
  if (itemCount === 0) {
    return { subtotalPaise: 0, deliveryFeePaise: 0, totalPaise: 0, itemCount: 0, freeDeliveryGapPaise: null };
  }
  const threshold = settings.freeDeliveryAbovePaise;
  const free = threshold != null && subtotalPaise >= threshold;
  const deliveryFeePaise = free ? 0 : Math.max(0, settings.deliveryFeePaise);
  const freeDeliveryGapPaise = !free && threshold != null && deliveryFeePaise > 0 ? threshold - subtotalPaise : null;
  return { subtotalPaise, deliveryFeePaise, totalPaise: subtotalPaise + deliveryFeePaise, itemCount, freeDeliveryGapPaise };
}

/**
 * Who may move an order where.
 * - system: payment captured (awaiting_payment → placed) or hold expired (→ cancelled).
 * - customer: cancel before it is packed (awaiting_payment or placed).
 * - admin: packs, ships, delivers, cancels before dispatch, records returns.
 */
export function canTransitionStoreOrder(from: StoreOrderStatus, to: StoreOrderStatus, actor: StoreActor): boolean {
  if (from === to) return false;
  if (from === "cancelled" || from === "returned") return false;
  switch (actor) {
    case "system":
      return from === "awaiting_payment" && (to === "placed" || to === "cancelled");
    case "customer":
      return (from === "awaiting_payment" || from === "placed") && to === "cancelled";
    case "admin":
      if (from === "awaiting_payment") return to === "cancelled";
      if (from === "placed") return to === "packed" || to === "cancelled";
      if (from === "packed") return to === "out_for_delivery" || to === "cancelled";
      if (from === "out_for_delivery") return to === "delivered" || to === "returned";
      if (from === "delivered") return to === "returned";
      return false;
  }
}

/** Statuses an admin can move this order to next, in display order. */
export function nextAdminStatuses(from: StoreOrderStatus): StoreOrderStatus[] {
  return STORE_ORDER_STATUSES.filter((to) => canTransitionStoreOrder(from, to, "admin"));
}

export function canCustomerCancel(status: StoreOrderStatus): boolean {
  return canTransitionStoreOrder(status, "cancelled", "customer");
}

/** Cancelling a paid order leaves money to return. */
export function paymentStatusAfterCancel(current: StorePaymentStatus): StorePaymentStatus {
  return current === "paid" ? "refund_due" : current;
}

/** Cancelling (not returning) puts the units back on the shelf. */
export function restocksOnTransition(to: StoreOrderStatus): boolean {
  return to === "cancelled";
}

export interface StoreCodSettings {
  codEnabled: boolean;
  /** Largest COD order total; null = no limit. */
  codMaxPaise: number | null;
}

export function isCodAllowed(totalPaise: number, settings: StoreCodSettings): boolean {
  if (!settings.codEnabled) return false;
  return settings.codMaxPaise == null || totalPaise <= settings.codMaxPaise;
}

/** RS-YYMM-#### using the IST month of `date`. Sequences past 9999 just grow longer. */
export function formatStoreOrderNumber(seq: number, date: Date = new Date()): string {
  if (!Number.isInteger(seq) || seq < 1) throw new Error("Order sequence must be a positive integer");
  return `RS-${storeOrderPeriod(date)}-${String(seq).padStart(4, "0")}`;
}

/** YYMM in IST, the counter key behind order numbers. */
export function storeOrderPeriod(date: Date = new Date()): string {
  const [y, m] = todayIST(date).split("-") as [string, string];
  return y.slice(2) + m;
}

/** Whole-percent saving vs MRP, rounded down; 0 when there is no real saving. */
export function discountPercent(pricePaise: number, mrpPaise: number | null | undefined): number {
  if (mrpPaise == null || mrpPaise <= 0 || mrpPaise <= pricePaise) return 0;
  return Math.floor(((mrpPaise - pricePaise) * 100) / mrpPaise);
}

export type StockKind = "out" | "low" | "in";

export function stockLabel(stock: number, lowStockAt: number): { kind: StockKind; label: string } {
  if (stock <= 0) return { kind: "out", label: "Out of stock" };
  if (stock <= lowStockAt) return { kind: "low", label: `Only ${stock} left` };
  return { kind: "in", label: "In stock" };
}

/** Most of this product one order may take right now. */
export function maxOrderQty(stock: number): number {
  return Math.max(0, Math.min(STORE_MAX_LINE_QTY, stock));
}

export const STORE_AGE_BANDS = [
  { id: "0-3", label: "0–3 yrs", min: 0, max: 3 },
  { id: "3-5", label: "3–5 yrs", min: 3, max: 5 },
  { id: "5-8", label: "5–8 yrs", min: 5, max: 8 },
  { id: "8-12", label: "8–12 yrs", min: 8, max: 12 },
  { id: "12+", label: "12+ yrs", min: 12, max: null },
] as const;
export type StoreAgeBandId = (typeof STORE_AGE_BANDS)[number]["id"];

export function storeAgeBand(id: string | null | undefined) {
  return STORE_AGE_BANDS.find((b) => b.id === id) ?? null;
}

/** A product suits a band when its age range overlaps the band's range. */
export function ageBandMatches(
  product: { ageMin: number; ageMax: number | null },
  band: { min: number; max: number | null }
): boolean {
  const productMax = product.ageMax ?? Number.POSITIVE_INFINITY;
  const bandMax = band.max ?? Number.POSITIVE_INFINITY;
  return product.ageMin <= bandMax && productMax >= band.min;
}

/** "3–8 yrs", "8+ yrs", "All ages". */
export function ageRangeLabel(ageMin: number, ageMax: number | null): string {
  if (ageMax == null) return ageMin <= 0 ? "All ages" : `${ageMin}+ yrs`;
  return `${ageMin}–${ageMax} yrs`;
}

export interface StoreServiceSettings {
  serviceability: "geofence" | "india";
  serviceLatitude: number;
  serviceLongitude: number;
  serviceRadiusKm: number;
  serviceCity: string;
}

export type ServiceabilityResult =
  | { ok: true; distanceKm: number | null }
  | { ok: false; reason: "no_location" | "out_of_area"; message: string };

/** Ranchi-only for now (geofence around the service centre); "india" ships everywhere. */
export function storeServiceability(point: Coordinates | null, settings: StoreServiceSettings): ServiceabilityResult {
  if (settings.serviceability === "india") return { ok: true, distanceKm: null };
  if (!point) {
    return { ok: false, reason: "no_location", message: "Add your delivery address so we can check we deliver to you" };
  }
  const { isNearby, distanceKm } = isWithinGeofence(
    point.latitude,
    point.longitude,
    settings.serviceLatitude,
    settings.serviceLongitude,
    settings.serviceRadiusKm
  );
  return isNearby
    ? { ok: true, distanceKm }
    : { ok: false, reason: "out_of_area", message: `Delivering in ${settings.serviceCity} for now` };
}

/** URL-safe slug: lowercase words joined by dashes, max 80 chars. */
export function storeSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** Merges repeated product ids and caps each line, keeping first-seen order. */
export function mergeBagLines(items: { productId: string; qty: number }[]): { productId: string; qty: number }[] {
  const byId = new Map<string, number>();
  for (const i of items) {
    if (!Number.isInteger(i.qty) || i.qty <= 0) continue;
    byId.set(i.productId, Math.min(STORE_MAX_LINE_QTY, (byId.get(i.productId) ?? 0) + i.qty));
  }
  return [...byId].map(([productId, qty]) => ({ productId, qty }));
}
