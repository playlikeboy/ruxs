/**
 * Shapes returned by the RUXs Store queries and actions. Type-only module:
 * safe to import from client components with `import type`.
 */
import type {
  IndianState,
  PartnerMatch,
  StockKind,
  StoreAgeBandId,
  StoreCouponKind,
  StoreOrderStatus,
  StorePaymentMode,
  StorePaymentStatus,
  StoreReturnStatus,
  StoreReviewStatus,
  StoreStockReason,
} from "@/core/store";

export type {
  IndianState,
  PartnerMatch,
  StockKind,
  StoreAgeBandId,
  StoreCouponKind,
  StoreOrderStatus,
  StorePaymentMode,
  StorePaymentStatus,
  StoreReturnStatus,
  StoreReviewStatus,
  StoreStockReason,
};

/*
 * PRIVACY RULE. Everything above the "Admin" divider is household-facing and
 * must never carry fulfilment-partner data (partner id/name/ref/notes,
 * forwarded_at, zone names). Households only ever see "Shipped by RUXs".
 * Partner fields live on the Admin* types only.
 */

/** Every action returns this: `{ ok: true, ...data }` or `{ ok: false, error }` (error is user-facing copy). */
export type StoreActionResult<T extends object = object> = ({ ok: true } & T) | { ok: false; error: string };

// ─── Catalog (household) ─────────────────────────────────────────────

export interface StoreCategory {
  id: string; // slug, used in /app/kids/shop/[category]
  name: string;
  description: string;
  /** lucide-react icon name, e.g. "Bot". */
  icon: string;
  sort: number;
  isActive: boolean;
  /** Active, in-catalog products in this category. */
  productCount: number;
}

export interface StoreStock {
  kind: StockKind; // out | low | in
  label: string; // "Out of stock" | "Only 3 left" | "In stock"
  /** Most a household may add to the bag right now (0 when out of stock). */
  maxQty: number;
}

export interface StoreProductCard {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  brand: string;
  categoryId: string;
  categoryName: string;
  pricePaise: number;
  mrpPaise: number | null;
  /** Whole percent off MRP; 0 = show no badge. */
  discountPercent: number;
  /** First image URL, or null. */
  image: string | null;
  ageMin: number;
  ageMax: number | null;
  ageLabel: string; // "3–8 yrs", "8+ yrs", "All ages"
  skills: string[];
  isFeatured: boolean;
  stock: StoreStock;
  /** Published reviews only. */
  rating: StoreRating;
}

export interface StoreRating {
  /** One decimal place, e.g. 4.3; null when there are no published reviews. */
  average: number | null;
  count: number;
}

/** A published review as households see it. */
export interface StoreReviewView {
  id: string;
  rating: number; // 1-5
  title: string;
  body: string;
  /** First name only, e.g. "Priya"; "RUXs customer" when unknown. */
  authorName: string;
  createdAt: Date;
}

export interface StoreProductDetail extends StoreProductCard {
  description: string;
  images: string[]; // up to 6
  boxContents: string[];
  safetyNotes: string;
  weightGrams: number | null;
  gstBps: number; // GST rate already included in the price
  category: { id: string; name: string; icon: string };
  related: StoreProductCard[];
  /** Newest published reviews, up to 20. */
  reviews: StoreReviewView[];
  /** Published reviews per star, index 0 = 1 star … index 4 = 5 stars. */
  ratingBreakdown: [number, number, number, number, number];
}

/** What the signed-in household can do with one product (getMyStoreProductState). */
export interface MyStoreProductState {
  wishlisted: boolean;
  /** Subscribed to a back-in-stock email that has not been sent yet. */
  stockAlert: boolean;
  /** Has a delivered order with this product and has not reviewed it yet. */
  canReview: boolean;
  /** My review, whatever its moderation status. */
  myReview: { id: string; rating: number; title: string; body: string; status: StoreReviewStatus; createdAt: Date } | null;
}

export interface StoreWishlistItem extends StoreProductCard {
  addedAt: Date;
  stockAlert: boolean;
}

/** Public store settings: what households may see. */
export interface PublicStoreSettings {
  isOpen: boolean;
  closedMessage: string | null;
  codEnabled: boolean;
  codMaxPaise: number | null;
  deliveryFeePaise: number;
  freeDeliveryAbovePaise: number | null;
  minOrderPaise: number;
  /** "india" = ships across India (PIN decides fee/estimate); "geofence" = one city only. */
  serviceability: "geofence" | "india";
  serviceCity: string;
  dispatchDays: number;
  /** Delivery estimate when no shipping zone matches the PIN code. */
  defaultEtaMinDays: number;
  defaultEtaMaxDays: number;
  /** Days after delivery a return can be requested; 0 = returns off. */
  returnWindowDays: number;
}

export type StoreSort = "featured" | "new" | "price_asc" | "price_desc";

/** A curated rail on the shop home. */
export interface StoreCollectionRail {
  id: string;
  slug: string; // /app/kids/shop/c/[slug]
  title: string;
  subtitle: string;
  image: string | null;
  products: StoreProductCard[];
}

export interface StoreCollectionPage {
  settings: PublicStoreSettings;
  collection: StoreCollectionRail; // every in-catalog product of the collection
  age: StoreAgeBandId | null;
  sort: StoreSort | "curated";
}

export interface StoreHome {
  settings: PublicStoreSettings;
  /** Active collections with at least one product, in sort order; up to 12 products each. */
  collections: StoreCollectionRail[];
  categories: StoreCategory[]; // active categories in sort order; productCount may be 0 (UI may hide those)
  featured: StoreProductCard[]; // up to 8
  newArrivals: StoreProductCard[]; // up to 8
  /** Grid: every in-catalog product, filtered by `age` when given (up to 60). */
  products: StoreProductCard[];
  age: StoreAgeBandId | null;
}

export interface StoreCategoryPage {
  settings: PublicStoreSettings;
  category: StoreCategory;
  categories: StoreCategory[];
  products: StoreProductCard[];
  age: StoreAgeBandId | null;
  sort: StoreSort;
}

// ─── Bag quote / checkout ────────────────────────────────────────────

export interface StoreBagQuoteLine {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  unitPricePaise: number;
  mrpPaise: number | null;
  /** Requested qty after merging and capping. */
  requestedQty: number;
  /** Qty that can actually be bought (≤ stock, ≤ 10). 0 = unavailable. */
  qty: number;
  lineTotalPaise: number; // unitPricePaise * qty
  stock: StoreStock;
  /** Why this line changed or cannot be bought, else null. */
  issue: "unavailable" | "out_of_stock" | "qty_reduced" | null;
}

/** Ship-to address typed at checkout. Phone is normalised to +91XXXXXXXXXX on the server. */
export interface StoreShippingAddress {
  name: string;
  phone: string;
  line1: string; // house / flat / street
  line2: string; // area / locality ("" when blank)
  landmark: string; // "" when blank
  city: string;
  state: IndianState;
  pincode: string; // 6 digits, first 1-9
}

/** Starting values for the checkout address form. */
export interface StoreCheckoutPrefill extends Omit<StoreShippingAddress, "state"> {
  state: IndianState | "";
  /** Where the values came from: my last store order, my RUXs profile, or nothing yet. */
  source: "last_order" | "profile" | "none";
  email: string | null;
}

/** Delivery fee, estimate and COD for the destination in the quote. */
export interface StoreShippingQuote {
  /** False until a valid PIN code is given: fee/estimate are then the store defaults. */
  resolved: boolean;
  pincode: string | null;
  state: IndianState | null;
  feePaise: number; // before the free-delivery rule
  freeAbovePaise: number | null;
  etaMinDays: number;
  etaMaxDays: number;
  /** "2–4 days": delivery time after dispatch. */
  etaLabel: string;
  /** Pay on delivery is offered at this PIN code (store COD switch/limit still apply). */
  codAllowed: boolean;
}

export interface StoreCouponQuote {
  code: string; // upper-case
  applied: boolean;
  discountPaise: number; // 0 when not applied
  /** Why it was not applied ("This code has expired"), else null. */
  message: string | null;
  description: string;
}

export interface StoreBagQuote {
  lines: StoreBagQuoteLine[];
  /** Product ids from the bag that no longer exist / are archived / inactive. Drop them from localStorage. */
  removedProductIds: string[];
  subtotalPaise: number;
  deliveryFeePaise: number;
  /** Coupon discount already taken off totalPaise. */
  discountPaise: number;
  /** subtotal + delivery - discount. Send it back as placeStoreOrder.expectedTotalPaise. */
  totalPaise: number;
  itemCount: number;
  freeDeliveryGapPaise: number | null;
  settings: PublicStoreSettings;
  /** Payment modes allowed for this total right now. */
  paymentModes: StorePaymentMode[];
  /** True when any line has an issue (UI should show a "bag updated" note). */
  changed: boolean;
  /** Reasons checkout is blocked, in display order; empty = can place the order. */
  blockers: string[];
  /** Null when no code was sent with the quote. */
  coupon: StoreCouponQuote | null;
  shipping: StoreShippingQuote;
  /** Saved RUXs profile check (null when not signed in). In "india" mode it never blocks checkout. */
  delivery: StoreDeliveryCheck | null;
}

export interface StoreDeliveryCheck {
  hasProfile: boolean;
  name: string | null;
  phone: string | null;
  address: string | null;
  /** india mode: always true. geofence mode: the saved address is inside the delivery area. */
  serviceable: boolean;
  /** "Delivering in Ranchi for now", "Add your delivery address…", or null. */
  message: string | null;
}

/** Same shape as the vendor checkout (`src/features/payments/actions.ts` CheckoutOptions). */
export interface StoreCheckoutOptions {
  keyId: string;
  razorpayOrderId: string;
  amountPaise: number;
  description: string;
  prefill: { name: string; email: string; contact: string };
}

// ─── Orders (household) ──────────────────────────────────────────────

export interface StoreOrderItemView {
  id: string;
  productId: string;
  productSlug: string | null;
  name: string;
  image: string | null;
  unitPricePaise: number;
  qty: number;
  lineTotalPaise: number;
  /** Order delivered and I have not reviewed this product yet (false on admin views). */
  canReview: boolean;
  /** My rating for this product, if I reviewed it (null on admin views). */
  myRating: number | null;
}

/** A household's return request as they see it. */
export interface StoreReturnView {
  id: string;
  status: StoreReturnStatus;
  statusLabel: string;
  reason: string;
  /** Message from RUXs (e.g. why it was declined), else null. */
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreOrderSummary {
  id: string;
  orderNumber: string;
  status: StoreOrderStatus;
  statusLabel: string;
  paymentMode: StorePaymentMode;
  paymentStatus: StorePaymentStatus;
  totalPaise: number;
  itemCount: number;
  /** First item's name and image, for list rows. */
  firstItemName: string | null;
  firstItemImage: string | null;
  createdAt: Date;
}

export interface StoreTimelineStep {
  status: StoreOrderStatus;
  label: string;
  at: Date | null;
  done: boolean;
}

export interface StoreOrderDetail extends StoreOrderSummary {
  items: StoreOrderItemView[];
  subtotalPaise: number;
  deliveryFeePaise: number;
  discountPaise: number;
  couponCode: string | null;
  customerName: string;
  phone: string;
  /** One-line ship-to address. */
  address: string;
  /** Structured ship-to; null on orders placed before pan-India checkout. */
  shipTo: { line1: string; line2: string; landmark: string; city: string; state: string; pincode: string } | null;
  /** Delivery estimate after dispatch ("2–4 days"); null when unknown. */
  etaLabel: string | null;
  etaMinDays: number | null;
  etaMaxDays: number | null;
  notes: string | null;
  /** Always "RUXs" for households: who actually carries the parcel is internal. */
  shippedBy: "RUXs";
  /**
   * Household views: always null (the carrier name is internal; show `shippedBy`).
   * Admin views (AdminStoreOrderDetail): the real courier name.
   */
  courier: string | null;
  trackingNumber: string | null;
  cancelReason: string | null;
  timeline: StoreTimelineStep[];
  placedAt: Date | null;
  packedAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  returnedAt: Date | null;
  canCancel: boolean;
  /** Online order still unpaid and within its hold: show "Pay now" (startStoreOrderPayment). */
  canPay: boolean;
  /** When an unpaid online order's stock hold ends. */
  payBy: Date | null;
  dispatchDays: number;
  /** Delivered, inside the return window and no live return request. */
  canRequestReturn: boolean;
  /** Last moment to ask for a return; null when not delivered or returns are off. */
  returnUntil: Date | null;
  /** The latest return request for this order, if any. */
  returnRequest: StoreReturnView | null;
}

// ─── Admin ───────────────────────────────────────────────────────────

/** Full settings row (admin). */
export interface StoreSettings extends PublicStoreSettings {
  serviceLatitude: number;
  serviceLongitude: number;
  serviceRadiusKm: number;
  /** INTERNAL: placed orders go straight to the best-matching fulfilment partner. */
  autoForward: boolean;
  updatedBy: string | null;
  updatedAt: Date | null;
}

export type AdminStoreProductFilter = "all" | "active" | "inactive" | "archived" | "low" | "out";

export interface AdminStoreProductRow {
  id: string;
  slug: string;
  sku: string;
  name: string;
  brand: string;
  categoryId: string;
  categoryName: string;
  pricePaise: number;
  mrpPaise: number | null;
  stock: number;
  lowStockAt: number;
  stockKind: StockKind;
  image: string | null;
  isActive: boolean;
  isFeatured: boolean;
  archivedAt: Date | null;
  updatedAt: Date;
}

export interface AdminStoreProductList {
  rows: AdminStoreProductRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  counts: Record<AdminStoreProductFilter, number>;
  categories: { id: string; name: string }[];
}

export interface AdminStoreProduct {
  id: string;
  slug: string;
  categoryId: string;
  name: string;
  tagline: string;
  description: string;
  brand: string;
  sku: string;
  pricePaise: number;
  mrpPaise: number | null;
  gstBps: number;
  stock: number;
  lowStockAt: number;
  ageMin: number;
  ageMax: number | null;
  skills: string[];
  boxContents: string[];
  safetyNotes: string;
  images: string[];
  weightGrams: number | null;
  isFeatured: boolean;
  isActive: boolean;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminStockMovement {
  id: string;
  delta: number;
  stockAfter: number;
  reason: StoreStockReason;
  orderId: string | null;
  orderNumber: string | null;
  actor: string;
  note: string | null;
  createdAt: Date;
}

export interface AdminStoreProductDetail {
  product: AdminStoreProduct;
  movements: AdminStockMovement[]; // newest first, up to 30
  categories: { id: string; name: string; isActive: boolean }[];
  /** Units sold in non-cancelled orders. */
  unitsSold: number;
}

/** `to_forward` = placed/packed orders not yet handed to a fulfilment partner. */
export type AdminStoreOrderFilter = StoreOrderStatus | "open" | "all" | "refund_due" | "to_forward";

export interface AdminStoreOrderRow {
  id: string;
  orderNumber: string;
  status: StoreOrderStatus;
  paymentMode: StorePaymentMode;
  paymentStatus: StorePaymentStatus;
  totalPaise: number;
  itemCount: number;
  customerName: string;
  phone: string;
  createdAt: Date;
  shipCity: string | null;
  shipState: string | null;
  shipPincode: string | null;
  partnerId: string | null;
  partnerName: string | null;
  forwardedAt: Date | null;
}

export interface AdminStoreOrderList {
  rows: AdminStoreOrderRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  counts: Record<AdminStoreOrderFilter, number>;
  /** Active partners, for the bulk-forward picker. */
  partners: { id: string; name: string }[];
}

export interface AdminStorePaymentRow {
  id: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  amountPaise: number;
  status: "created" | "paid" | "failed";
  failureReason: string | null;
  refundId: string | null;
  paidAt: Date | null;
  refundedAt: Date | null;
  createdAt: Date;
}

export interface AdminStoreOrderDetail extends StoreOrderDetail {
  userId: string;
  adminNote: string | null;
  latitude: number | null;
  longitude: number | null;
  email: string | null;
  payments: AdminStorePaymentRow[];
  /** Statuses the admin can move to next. */
  nextStatuses: StoreOrderStatus[];
  /** paymentStatus is paid/refund_due and the order is cancelled or returned. */
  canRefund: boolean;
  updatedAt: Date;
  /** Shipping zone that priced this order; null = store defaults. */
  zoneName: string | null;
  /** Cash the delivery agent must collect (0 for prepaid orders). */
  codToCollectPaise: number;
  fulfilment: AdminOrderFulfilment;
  adminReturn: AdminStoreReturn | null;
  /** Newest first, up to 30. */
  audit: AdminAuditEntry[];
}

// ─── Admin: fulfilment partners (INTERNAL) ───────────────────────────

export interface AdminFulfilmentPartner {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  coverageStates: string[];
  coveragePinPrefixes: string[];
  isActive: boolean;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  /** Forwarded orders not yet delivered/cancelled/returned. */
  openOrders: number;
  /** Every order ever forwarded to this partner. */
  totalOrders: number;
}

export interface AdminPartnerSuggestion {
  partnerId: string;
  name: string;
  email: string;
  /** Why it matches: PIN prefix, state, or it takes orders from anywhere. */
  matchedBy: PartnerMatch;
  score: number;
  openOrders: number;
}

export interface AdminOrderFulfilment {
  partnerId: string | null;
  partnerName: string | null;
  partnerEmail: string | null;
  forwardedAt: Date | null;
  /** When the order email reached the partner's inbox queue; null = not sent (resend with forwardStoreOrder). */
  forwardEmailedAt: Date | null;
  /** The partner's own reference / AWB for this order. */
  partnerRef: string | null;
  partnerStatusNote: string | null;
  /** Order is placed or packed. */
  canForward: boolean;
  /** Best match first. */
  suggestions: AdminPartnerSuggestion[];
}

// ─── Admin: shipping zones ───────────────────────────────────────────

export interface AdminShippingZone {
  id: string;
  name: string;
  pinPrefixes: string[];
  states: string[];
  feePaise: number;
  freeAbovePaise: number | null;
  etaMinDays: number;
  etaMaxDays: number;
  codAllowed: boolean;
  isActive: boolean;
  sort: number;
  updatedAt: Date;
}

export interface AdminShippingZonesPage {
  zones: AdminShippingZone[];
  /** What a PIN code outside every zone gets (from store settings). */
  defaults: { feePaise: number; freeAbovePaise: number | null; etaMinDays: number; etaMaxDays: number };
  states: readonly IndianState[];
}

// ─── Admin: coupons ──────────────────────────────────────────────────

export type AdminCouponState = "live" | "scheduled" | "expired" | "used_up" | "off";

export interface AdminStoreCoupon {
  id: string;
  code: string;
  description: string;
  kind: StoreCouponKind;
  /** percent: basis points (1000 = 10%); flat: paise. */
  value: number;
  minOrderPaise: number;
  maxDiscountPaise: number | null;
  usageLimit: number | null;
  perUserLimit: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
  state: AdminCouponState;
  /** Orders that used it, not counting cancelled ones. */
  uses: number;
  discountGivenPaise: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Admin: reviews ──────────────────────────────────────────────────

export interface AdminStoreReview {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  userId: string;
  customerName: string | null;
  orderId: string;
  orderNumber: string | null;
  rating: number;
  title: string;
  body: string;
  status: StoreReviewStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminStoreReviewList {
  rows: AdminStoreReview[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  counts: Record<StoreReviewStatus | "all", number>;
}

// ─── Admin: returns ──────────────────────────────────────────────────

export interface AdminStoreReturn {
  id: string;
  orderId: string;
  orderNumber: string;
  orderStatus: StoreOrderStatus;
  paymentMode: StorePaymentMode;
  paymentStatus: StorePaymentStatus;
  totalPaise: number;
  userId: string;
  customerName: string;
  phone: string;
  reason: string;
  status: StoreReturnStatus;
  statusLabel: string;
  adminNote: string | null;
  nextStatuses: StoreReturnStatus[];
  createdAt: Date;
  updatedAt: Date;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  receivedAt: Date | null;
  refundedAt: Date | null;
}

export interface AdminStoreReturnList {
  rows: AdminStoreReturn[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  counts: Record<StoreReturnStatus | "all", number>;
}

// ─── Admin: collections ──────────────────────────────────────────────

export interface AdminStoreCollection {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  image: string | null;
  isActive: boolean;
  sort: number;
  productCount: number;
  updatedAt: Date;
}

export interface AdminStoreCollectionDetail extends AdminStoreCollection {
  /** In rail order. */
  products: AdminStoreProductRow[];
}

// ─── Admin: audit log ────────────────────────────────────────────────

export interface AdminAuditEntry {
  id: string;
  actorUserId: string;
  /** "order.forward", "product.save", "coupon.save", … */
  action: string;
  entity: string;
  entityId: string | null;
  data: Record<string, unknown>;
  createdAt: Date;
}

export interface AdminAuditList {
  rows: AdminAuditEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Admin: analytics / import / export ──────────────────────────────

export interface AdminStoreAnalytics {
  /** Oldest first, one entry per IST day for the last 30 days (zero-filled). Booked sales: not cancelled, not awaiting payment. */
  revenueByDay: { date: string; orders: number; revenuePaise: number }[];
  totals: { orders: number; revenuePaise: number; discountPaise: number; averageOrderPaise: number };
  /** Every status, all time. */
  ordersByStatus: Record<StoreOrderStatus, number>;
  /** Last 30 days, by units, up to 10. */
  topProducts: { productId: string; name: string; sku: string | null; units: number; revenuePaise: number }[];
  /** Active products at or below their low-stock level, lowest first, up to 20. */
  lowStock: AdminStoreProductRow[];
  /** Last 30 days, booked orders. */
  paymentSplit: Record<StorePaymentMode, { orders: number; revenuePaise: number }>;
  /** Last 30 days, by uses. */
  couponUsage: { couponId: string; code: string; uses: number; discountPaise: number; revenuePaise: number }[];
  /** INTERNAL. Active partners plus an "unassigned" row (partnerId null). */
  partnerWorkload: { partnerId: string | null; name: string; open: number; forwarded30d: number; delivered30d: number }[];
  returns: { requested: number; approved: number; received: number; refunded: number; rejected: number };
}

/** Ready-to-download CSV (UTF-8, formula-safe cells). */
export interface StoreCsvExport {
  filename: string;
  csv: string;
  rowCount: number;
}

export interface StoreImportRowError {
  /** 1-based line in the pasted CSV (the header is line 1). */
  line: number;
  sku: string | null;
  message: string;
}

export interface StoreImportResult {
  /** True when nothing was written: a dry run, no valid row, or the write failed. Invalid rows are skipped, valid ones are imported. */
  dryRun: boolean;
  totalRows: number;
  created: number;
  updated: number;
  errors: StoreImportRowError[];
}

export interface StoreBulkStockResult {
  updated: number;
  unchanged: number;
  errors: StoreImportRowError[];
}

export interface AdminStoreCategory extends StoreCategory {
  /** All non-archived products, active or not. */
  totalProducts: number;
}

export interface AdminStoreOverview {
  openByStatus: Record<"awaiting_payment" | "placed" | "packed" | "out_for_delivery", number>;
  refundDue: number;
  lowStock: AdminStoreProductRow[]; // active products at or below lowStockAt, up to 10, lowest first
  outOfStockCount: number;
  activeProducts: number;
  /** IST calendar month to date. Online = paid and not refunded; COD = delivered. */
  month: { label: string; onlinePaise: number; codPaise: number; totalPaise: number; orders: number };
  recentOrders: AdminStoreOrderRow[]; // newest 8
  settings: { isOpen: boolean; codEnabled: boolean };
}
