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

export const STORE_STOCK_REASONS = ["restock", "order", "cancel", "adjust", "return"] as const;
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
  /** Coupon discount actually applied (never more than the subtotal). */
  discountPaise: number;
  /** subtotal + delivery fee - discount. */
  totalPaise: number;
  itemCount: number;
  /** How much more to add for free delivery; null when already free or never free. */
  freeDeliveryGapPaise: number | null;
}

/**
 * Subtotal, delivery fee (free above the threshold), coupon discount and total.
 * The free-delivery threshold looks at the subtotal before the discount, and the
 * discount comes off the items only, never the delivery fee. An empty bag costs nothing.
 */
export function storeCartTotals(
  items: { unitPricePaise: number; qty: number }[],
  settings: StoreFeeSettings,
  discountPaise = 0
): StoreCartTotals {
  if (!Number.isInteger(discountPaise) || discountPaise < 0) throw new Error("Store discount must be non-negative integer paise");
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
    return { subtotalPaise: 0, deliveryFeePaise: 0, discountPaise: 0, totalPaise: 0, itemCount: 0, freeDeliveryGapPaise: null };
  }
  const threshold = settings.freeDeliveryAbovePaise;
  const free = threshold != null && subtotalPaise >= threshold;
  const deliveryFeePaise = free ? 0 : Math.max(0, settings.deliveryFeePaise);
  const freeDeliveryGapPaise = !free && threshold != null && deliveryFeePaise > 0 ? threshold - subtotalPaise : null;
  const applied = Math.min(discountPaise, subtotalPaise);
  return {
    subtotalPaise,
    deliveryFeePaise,
    discountPaise: applied,
    totalPaise: subtotalPaise + deliveryFeePaise - applied,
    itemCount,
    freeDeliveryGapPaise,
  };
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

/** "india" ships everywhere (the PIN code decides fee and estimate); "geofence" keeps to one city. */
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

// ─── Pan-India shipping address ──────────────────────────────────────

/** States and union territories, as written on a shipping label. */
export const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;
export type IndianState = (typeof INDIAN_STATES)[number];

const STATE_BY_KEY = new Map<string, IndianState>(INDIAN_STATES.map((s) => [stateKey(s), s]));

function stateKey(v: string): string {
  return v.toLowerCase().replace(/&/g, "and").replace(/[^a-z]/g, "");
}

/** The canonical state name for loosely typed input ("jharkhand", "Jammu & Kashmir"), else null. */
export function normalizeIndianState(v: string | null | undefined): IndianState | null {
  if (!v) return null;
  return STATE_BY_KEY.get(stateKey(v)) ?? null;
}

/** Indian PIN code: six digits, the first never 0. */
export function isValidPincode(v: string | null | undefined): v is string {
  return typeof v === "string" && /^[1-9][0-9]{5}$/.test(v);
}

/** A PIN prefix used by zones and partner coverage: 1 to 6 digits, the first never 0. */
export function isValidPinPrefix(v: string): boolean {
  return /^[1-9][0-9]{0,5}$/.test(v);
}

/** "+91XXXXXXXXXX" for an Indian mobile typed with or without +91 / 0 / spaces, else null. */
export function normalizeIndianMobile(v: string | null | undefined): string | null {
  if (!v) return null;
  let digits = v.replace(/[\s\-().]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (!/^[0-9]+$/.test(digits)) return null;
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9][0-9]{9}$/.test(digits) ? `+91${digits}` : null;
}

export interface StoreShipAddress {
  line1: string;
  line2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  pincode: string;
}

/** One-line address for labels and order pages: "Flat 1, Test Society, Near park, Ranchi, Jharkhand 834001". */
export function formatShipAddress(a: StoreShipAddress): string {
  const head = [a.line1, a.line2, a.landmark, a.city].map((p) => p?.trim()).filter(Boolean);
  return [...head, `${a.state} ${a.pincode}`.trim()].join(", ");
}

// ─── Shipping zones ──────────────────────────────────────────────────

export interface ShippingZoneRule {
  id: string;
  name: string;
  pinPrefixes: readonly string[];
  states: readonly string[];
  feePaise: number;
  freeAbovePaise: number | null;
  etaMinDays: number;
  etaMaxDays: number;
  codAllowed: boolean;
  isActive: boolean;
  sort: number;
}

export interface ShippingDefaults {
  deliveryFeePaise: number;
  freeDeliveryAbovePaise: number | null;
  defaultEtaMinDays: number;
  defaultEtaMaxDays: number;
}

export interface ResolvedShipping {
  /** Null when no zone matched and the store defaults apply. */
  zoneId: string | null;
  zoneName: string | null;
  matchedBy: "pin" | "state" | "default";
  feePaise: number;
  freeAbovePaise: number | null;
  etaMinDays: number;
  etaMaxDays: number;
  /** The zone allows cash on delivery (the store-wide COD switch and limit still apply). */
  codAllowed: boolean;
}

function longestPrefix(pincode: string, prefixes: readonly string[]): number {
  let best = 0;
  for (const raw of prefixes) {
    const p = raw.trim();
    if (p && p.length > best && pincode.startsWith(p)) best = p.length;
  }
  return best;
}

/**
 * Which fee, estimate and COD rule a destination gets: the active zone with the
 * longest matching PIN prefix, else the first active zone listing the state,
 * else the store defaults. Ties go to the lower `sort`, then the name.
 */
export function resolveShippingZone(
  dest: { pincode?: string | null; state?: string | null },
  zones: readonly ShippingZoneRule[],
  defaults: ShippingDefaults
): ResolvedShipping {
  const active = zones.filter((z) => z.isActive).sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name));
  const fromZone = (z: ShippingZoneRule, matchedBy: "pin" | "state"): ResolvedShipping => ({
    zoneId: z.id,
    zoneName: z.name,
    matchedBy,
    feePaise: Math.max(0, z.feePaise),
    freeAbovePaise: z.freeAbovePaise,
    etaMinDays: z.etaMinDays,
    etaMaxDays: Math.max(z.etaMinDays, z.etaMaxDays),
    codAllowed: z.codAllowed,
  });

  if (isValidPincode(dest.pincode)) {
    let best: ShippingZoneRule | null = null;
    let bestLen = 0;
    for (const z of active) {
      const len = longestPrefix(dest.pincode, z.pinPrefixes);
      if (len > bestLen) {
        best = z;
        bestLen = len;
      }
    }
    if (best) return fromZone(best, "pin");
  }
  const state = normalizeIndianState(dest.state);
  if (state) {
    const byState = active.find((z) => z.states.some((s) => normalizeIndianState(s) === state));
    if (byState) return fromZone(byState, "state");
  }
  return {
    zoneId: null,
    zoneName: null,
    matchedBy: "default",
    feePaise: Math.max(0, defaults.deliveryFeePaise),
    freeAbovePaise: defaults.freeDeliveryAbovePaise,
    etaMinDays: defaults.defaultEtaMinDays,
    etaMaxDays: Math.max(defaults.defaultEtaMinDays, defaults.defaultEtaMaxDays),
    codAllowed: true,
  };
}

/** "2–4 days", "3 days", "1 day", "Today". Counted from dispatch. */
export function etaLabel(minDays: number, maxDays: number): string {
  const max = Math.max(minDays, maxDays);
  if (max <= 0) return "Today";
  if (minDays === max) return `${max} ${max === 1 ? "day" : "days"}`;
  return `${minDays}–${max} days`;
}

// ─── Coupons ─────────────────────────────────────────────────────────

export const STORE_COUPON_KINDS = ["percent", "flat"] as const;
export type StoreCouponKind = (typeof STORE_COUPON_KINDS)[number];

export interface StoreCouponRule {
  kind: StoreCouponKind;
  /** percent: basis points (1000 = 10%). flat: paise. */
  value: number;
  minOrderPaise: number;
  /** Cap on a percent discount; null = no cap. */
  maxDiscountPaise: number | null;
  usageLimit: number | null;
  perUserLimit: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
}

/** Codes are compared upper-case with no spaces. */
export function normalizeCouponCode(v: string): string {
  return v.trim().toUpperCase().replace(/\s+/g, "");
}

/**
 * Paise taken off the subtotal. Percent discounts round down and respect the
 * cap; no discount is ever more than the subtotal. Integer maths only.
 */
export function couponDiscountPaise(coupon: Pick<StoreCouponRule, "kind" | "value" | "maxDiscountPaise">, subtotalPaise: number): number {
  if (!Number.isInteger(subtotalPaise) || subtotalPaise <= 0) return 0;
  if (!Number.isInteger(coupon.value) || coupon.value <= 0) return 0;
  let off: number;
  if (coupon.kind === "percent") {
    off = Math.floor((subtotalPaise * Math.min(coupon.value, 10_000)) / 10_000);
    if (coupon.maxDiscountPaise != null) off = Math.min(off, coupon.maxDiscountPaise);
  } else {
    off = coupon.value;
  }
  return Math.max(0, Math.min(off, subtotalPaise));
}

export type CouponRejection = "inactive" | "not_started" | "expired" | "min_order" | "usage_limit" | "per_user_limit" | "no_discount";

export type CouponCheck = { ok: true; discountPaise: number } | { ok: false; reason: CouponRejection; message: string };

/** Whether a coupon applies to this bag right now, and how much it takes off. */
export function checkStoreCoupon(
  coupon: StoreCouponRule,
  ctx: { subtotalPaise: number; now: Date; totalUses: number; userUses: number }
): CouponCheck {
  const no = (reason: CouponRejection, message: string): CouponCheck => ({ ok: false, reason, message });
  if (!coupon.isActive) return no("inactive", "This code is not active");
  if (coupon.startsAt && ctx.now < coupon.startsAt) return no("not_started", "This code is not active yet");
  if (coupon.endsAt && ctx.now >= coupon.endsAt) return no("expired", "This code has expired");
  if (coupon.usageLimit != null && ctx.totalUses >= coupon.usageLimit) return no("usage_limit", "This code has been fully used");
  if (coupon.perUserLimit != null && ctx.userUses >= coupon.perUserLimit) return no("per_user_limit", "You have already used this code");
  if (ctx.subtotalPaise < coupon.minOrderPaise) {
    const rupees = Math.ceil(coupon.minOrderPaise / 100);
    return no("min_order", `Add items worth ₹${rupees} or more to use this code`);
  }
  const discountPaise = couponDiscountPaise(coupon, ctx.subtotalPaise);
  if (discountPaise <= 0) return no("no_discount", "This code does not apply to your bag");
  return { ok: true, discountPaise };
}

// ─── Reviews ─────────────────────────────────────────────────────────

export const STORE_REVIEW_STATUSES = ["pending", "published", "hidden"] as const;
export type StoreReviewStatus = (typeof STORE_REVIEW_STATUSES)[number];

/** Average to one decimal place; null with no reviews. */
export function ratingAverage(ratingSum: number, count: number): number | null {
  if (!Number.isFinite(ratingSum) || count <= 0) return null;
  return Math.round((ratingSum * 10) / count) / 10;
}

// ─── Returns ─────────────────────────────────────────────────────────

export const STORE_RETURN_STATUSES = ["requested", "approved", "rejected", "received", "refunded"] as const;
export type StoreReturnStatus = (typeof STORE_RETURN_STATUSES)[number];

export const STORE_RETURN_STATUS_LABELS: Record<StoreReturnStatus, string> = {
  requested: "Return requested",
  approved: "Return approved",
  rejected: "Return declined",
  received: "Return received",
  refunded: "Refunded",
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Last moment a return may be asked for. */
export function returnDeadline(deliveredAt: Date, windowDays: number): Date {
  return new Date(deliveredAt.getTime() + Math.max(0, windowDays) * DAY_MS);
}

export type ReturnEligibility = { ok: true; until: Date } | { ok: false; reason: "not_delivered" | "window_closed" | "returns_off"; message: string };

/** A delivered order can be returned within `windowDays` of delivery (0 switches returns off). */
export function canRequestReturn(
  order: { status: StoreOrderStatus; deliveredAt: Date | null },
  windowDays: number,
  now: Date = new Date()
): ReturnEligibility {
  if (windowDays <= 0) return { ok: false, reason: "returns_off", message: "Returns are not available for this order" };
  if (order.status !== "delivered" || !order.deliveredAt) {
    return { ok: false, reason: "not_delivered", message: "You can ask for a return once the order is delivered" };
  }
  const until = returnDeadline(order.deliveredAt, windowDays);
  if (now > until) {
    return { ok: false, reason: "window_closed", message: `The ${windowDays}-day return window for this order has ended` };
  }
  return { ok: true, until };
}

/** requested → approved | rejected; approved → received | rejected; received → refunded. */
export function canTransitionReturn(from: StoreReturnStatus, to: StoreReturnStatus): boolean {
  if (from === "requested") return to === "approved" || to === "rejected";
  if (from === "approved") return to === "received" || to === "rejected";
  if (from === "received") return to === "refunded";
  return false;
}

export function nextReturnStatuses(from: StoreReturnStatus): StoreReturnStatus[] {
  return STORE_RETURN_STATUSES.filter((to) => canTransitionReturn(from, to));
}

// ─── Stock alerts ────────────────────────────────────────────────────

/** True when a stock change took a product from none to some. */
export function cameBackInStock(stockAfter: number, delta: number): boolean {
  return delta > 0 && stockAfter > 0 && stockAfter - delta <= 0;
}

// ─── Fulfilment partners (internal: never household-facing) ──────────

export interface PartnerCoverage {
  id: string;
  name: string;
  coverageStates: readonly string[];
  coveragePinPrefixes: readonly string[];
  isActive: boolean;
  /** Orders already with this partner and not yet delivered; breaks ties. */
  openOrders?: number;
}

export type PartnerMatch = "pin" | "state" | "anywhere";

/**
 * How well a partner covers a destination; 0 = does not cover it.
 * A matching PIN prefix beats a state match (longer prefix = better); a partner
 * with no coverage listed takes orders from anywhere, as the last choice.
 */
export function partnerCoverageScore(
  partner: Pick<PartnerCoverage, "coverageStates" | "coveragePinPrefixes">,
  dest: { pincode?: string | null; state?: string | null }
): { score: number; matchedBy: PartnerMatch | null } {
  if (isValidPincode(dest.pincode)) {
    const len = longestPrefix(dest.pincode, partner.coveragePinPrefixes);
    if (len > 0) return { score: 1000 + len, matchedBy: "pin" };
  }
  const state = normalizeIndianState(dest.state);
  if (state && partner.coverageStates.some((s) => normalizeIndianState(s) === state)) return { score: 500, matchedBy: "state" };
  if (partner.coverageStates.length === 0 && partner.coveragePinPrefixes.length === 0) return { score: 1, matchedBy: "anywhere" };
  return { score: 0, matchedBy: null };
}

/** Active partners that cover the destination, best first (score, then lighter workload, then name). */
export function rankFulfilmentPartners<P extends PartnerCoverage>(
  partners: readonly P[],
  dest: { pincode?: string | null; state?: string | null }
): { partner: P; score: number; matchedBy: PartnerMatch }[] {
  const out: { partner: P; score: number; matchedBy: PartnerMatch }[] = [];
  for (const partner of partners) {
    if (!partner.isActive) continue;
    const { score, matchedBy } = partnerCoverageScore(partner, dest);
    if (score > 0 && matchedBy) out.push({ partner, score, matchedBy });
  }
  return out.sort(
    (a, b) => b.score - a.score || (a.partner.openOrders ?? 0) - (b.partner.openOrders ?? 0) || a.partner.name.localeCompare(b.partner.name)
  );
}

/** An order can be handed to a partner while it is waiting to be packed or shipped. */
export function canForwardStoreOrder(status: StoreOrderStatus): boolean {
  return status === "placed" || status === "packed";
}

/** Cash the delivery agent must collect at the door: the total for an unpaid COD order, else nothing. */
export function codAmountToCollect(order: { paymentMode: StorePaymentMode; paymentStatus: StorePaymentStatus; totalPaise: number }): number {
  return order.paymentMode === "cod" && order.paymentStatus === "unpaid" ? order.totalPaise : 0;
}
