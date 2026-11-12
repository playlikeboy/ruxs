/**
 * Shapes returned by the RUXs Store queries and actions. Type-only module:
 * safe to import from client components with `import type`.
 */
import type {
  StockKind,
  StoreAgeBandId,
  StoreOrderStatus,
  StorePaymentMode,
  StorePaymentStatus,
  StoreStockReason,
} from "@/core/store";

export type { StockKind, StoreAgeBandId, StoreOrderStatus, StorePaymentMode, StorePaymentStatus, StoreStockReason };

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
  serviceability: "geofence" | "india";
  serviceCity: string;
  dispatchDays: number;
}

export type StoreSort = "featured" | "new" | "price_asc" | "price_desc";

export interface StoreHome {
  settings: PublicStoreSettings;
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

export interface StoreBagQuote {
  lines: StoreBagQuoteLine[];
  /** Product ids from the bag that no longer exist / are archived / inactive. Drop them from localStorage. */
  removedProductIds: string[];
  subtotalPaise: number;
  deliveryFeePaise: number;
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
  /** Delivery address check (null when the household is not signed in or has no profile). */
  delivery: StoreDeliveryCheck | null;
}

export interface StoreDeliveryCheck {
  hasProfile: boolean;
  name: string | null;
  phone: string | null;
  address: string | null;
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
  customerName: string;
  phone: string;
  address: string;
  notes: string | null;
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
}

// ─── Admin ───────────────────────────────────────────────────────────

/** Full settings row (admin). */
export interface StoreSettings extends PublicStoreSettings {
  serviceLatitude: number;
  serviceLongitude: number;
  serviceRadiusKm: number;
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

export type AdminStoreOrderFilter = StoreOrderStatus | "open" | "all" | "refund_due";

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
}

export interface AdminStoreOrderList {
  rows: AdminStoreOrderRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  counts: Record<AdminStoreOrderFilter, number>;
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
