import { z } from "zod";
import {
  isValidPinPrefix,
  isValidPincode,
  normalizeCouponCode,
  normalizeIndianMobile,
  normalizeIndianState,
  STORE_AGE_BANDS,
  STORE_COUPON_KINDS,
  STORE_MAX_IMAGES,
  STORE_MAX_LINE_QTY,
  STORE_MAX_LINES,
  STORE_ORDER_STATUSES,
  STORE_PAYMENT_MODES,
  STORE_RETURN_STATUSES,
  STORE_REVIEW_STATUSES,
  type IndianState,
  type StoreReturnStatus,
  type StoreReviewStatus,
} from "@/core/store";
import type { AdminStoreOrderFilter, AdminStoreProductFilter, StoreAgeBandId, StoreSort } from "./types";

const MAX_PAISE = 100_000_000; // ₹10 lakh: a typo guard, not a business rule

const id = z.string().trim().min(1).max(64);
const paise = z.number().int("Use whole paise").min(0).max(MAX_PAISE);
const positivePaise = z.number().int("Use whole paise").min(1, "Price must be more than ₹0").max(MAX_PAISE);
const slug = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Slug is too short")
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes");

/** An uploaded path ("/…") or a full https link. Never "//host" or javascript:. */
const imageUrl = z
  .string()
  .trim()
  .min(1)
  .max(1000)
  .refine((v) => (v.startsWith("/") && !v.startsWith("//")) || /^https:\/\/[^\s]+$/i.test(v), "Upload an image or paste an https:// link");

const shortList = (max: number, itemMax: number) =>
  z
    .array(z.string().trim().max(itemMax))
    .max(max)
    .transform((list) => [...new Set(list.filter(Boolean))]);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

// ─── Household ───────────────────────────────────────────────────────

export const bagItemSchema = z.object({
  productId: id,
  qty: z.number().int().min(1).max(STORE_MAX_LINE_QTY),
});

const pincode = z
  .string({ error: "Enter a valid 6-digit PIN code" })
  .trim()
  .refine((v) => isValidPincode(v), "Enter a valid 6-digit PIN code");

const indianState = z
  .string({ error: "Choose your state" })
  .trim()
  .min(1, "Choose your state")
  .transform((v, ctx): IndianState => {
    const state = normalizeIndianState(v);
    if (!state) {
      ctx.addIssue({ code: "custom", message: "Choose your state" });
      return z.NEVER;
    }
    return state;
  });

const indianMobile = z
  .string({ error: "Enter your phone number" })
  .trim()
  .min(1, "Enter your phone number")
  .max(20)
  .transform((v, ctx) => {
    const phone = normalizeIndianMobile(v);
    if (!phone) {
      ctx.addIssue({ code: "custom", message: "Enter a valid 10-digit mobile number" });
      return z.NEVER;
    }
    return phone;
  });

const couponCode = z
  .string()
  .max(40)
  .transform(normalizeCouponCode)
  .refine((v) => /^[A-Z0-9][A-Z0-9_-]{2,23}$/.test(v), "Enter a valid code");

/** Blank means "no code". */
const optionalCouponCode = z
  .string()
  .max(40)
  .optional()
  .transform((v) => (v && normalizeCouponCode(v) ? normalizeCouponCode(v) : undefined));

/** Full ship-to address: required for every store order. */
export const shippingAddressSchema = z.object(
  {
    name: z.string({ error: "Enter the receiver's name" }).trim().min(2, "Enter the receiver's name").max(80),
    phone: indianMobile,
    line1: z.string({ error: "Enter your house / flat and street" }).trim().min(5, "Enter your house / flat and street").max(120),
    line2: z.string().trim().max(120).default(""),
    landmark: z.string().trim().max(80).default(""),
    city: z.string({ error: "Enter your city" }).trim().min(2, "Enter your city").max(60),
    state: indianState,
    pincode,
  },
  { error: "Add your full delivery address" }
);

export type StoreShippingAddressInput = z.input<typeof shippingAddressSchema>;

export const quoteBagSchema = z.object({
  items: z.array(bagItemSchema).max(STORE_MAX_LINES, "Your bag has too many items"),
  /** Destination so far: a half-typed PIN is fine, the quote just reports it as unresolved. */
  pincode: z.string().trim().max(10).optional(),
  state: z.string().trim().max(60).optional(),
  couponCode: optionalCouponCode,
});

export const placeStoreOrderSchema = z.object({
  clientKey: z.string().uuid(),
  items: z.array(bagItemSchema).min(1, "Your bag is empty").max(STORE_MAX_LINES, "Your bag has too many items"),
  paymentMode: z.enum(STORE_PAYMENT_MODES),
  shipping: shippingAddressSchema,
  couponCode: optionalCouponCode,
  /** The total the household saw. When sent, the order is refused if the server total differs. */
  expectedTotalPaise: z.number().int().min(0).max(MAX_PAISE * 10).optional(),
  notes: z.string().trim().max(300).optional(),
});

export const storeReviewSchema = z.object({
  productId: id,
  rating: z.number().int().min(1, "Pick a rating").max(5),
  title: z.string().trim().max(80).default(""),
  body: z.string().trim().max(1500).default(""),
});

export const storeReturnRequestSchema = z.object({
  orderId: id,
  reason: z.string().trim().min(5, "Tell us what went wrong").max(500),
});

export const storeOrderIdSchema = z.object({ orderId: id });

export const confirmStoreCheckoutSchema = z.object({
  razorpayOrderId: z.string().min(1).max(100),
  razorpayPaymentId: z.string().min(1).max(100),
  razorpaySignature: z.string().min(1).max(200),
});

// ─── Admin ───────────────────────────────────────────────────────────

export const storeProductSchema = z
  .object({
    /** Omit to create. */
    id: id.optional(),
    name: z.string().trim().min(3, "Name is too short").max(120),
    /** Optional: derived from the name when blank. */
    slug: z.union([slug, z.literal("")]).optional(),
    categoryId: id,
    tagline: z.string().trim().max(140).default(""),
    description: z.string().trim().max(5000).default(""),
    brand: z.string().trim().max(80).default(""),
    sku: z
      .string()
      .trim()
      .toUpperCase()
      .min(2, "Add a SKU")
      .max(40)
      .regex(/^[A-Z0-9][A-Z0-9-_]*$/, "SKU: letters, numbers, - and _"),
    pricePaise: positivePaise,
    mrpPaise: positivePaise.nullable().default(null),
    gstBps: z.number().int().min(0).max(2800).default(1800),
    lowStockAt: z.number().int().min(0).max(10_000).default(5),
    ageMin: z.number().int().min(0).max(18).default(0),
    ageMax: z.number().int().min(0).max(18).nullable().default(null),
    skills: shortList(12, 40).default([]),
    boxContents: shortList(40, 120).default([]),
    safetyNotes: z.string().trim().max(1000).default(""),
    images: z.array(imageUrl).max(STORE_MAX_IMAGES, `Up to ${STORE_MAX_IMAGES} images`).default([]),
    weightGrams: z.number().int().min(1).max(100_000).nullable().default(null),
    isFeatured: z.boolean().default(false),
    isActive: z.boolean().default(true),
    /** Opening stock, used only when creating (later changes go through adjustStock). */
    initialStock: z.number().int().min(0).max(100_000).default(0),
  })
  .refine((v) => v.mrpPaise == null || v.mrpPaise >= v.pricePaise, { message: "MRP can't be below the price", path: ["mrpPaise"] })
  .refine((v) => v.ageMax == null || v.ageMin <= v.ageMax, { message: "Max age must be at least the min age", path: ["ageMax"] });

export type StoreProductInput = z.input<typeof storeProductSchema>;

export const storeProductIdSchema = z.object({ productId: id });

export const adjustStockSchema = z.object({
  productId: id,
  /** Positive adds units, negative removes. Never zero. */
  delta: z
    .number()
    .int()
    .min(-100_000)
    .max(100_000)
    .refine((v) => v !== 0, "Enter how many units to add or remove"),
  reason: z.enum(["restock", "adjust"]),
  note: z.string().trim().max(200).optional(),
});

/** Static routes under /app/kids/shop that a category slug would shadow. */
const RESERVED_CATEGORY_SLUGS = new Set(["bag", "orders", "p"]);

export const storeCategorySchema = z.object({
  /** Slug. Existing id = update, new id = create. */
  id: slug.refine((v) => !RESERVED_CATEGORY_SLUGS.has(v), "That slug is used by a store page. Pick another."),
  name: z.string().trim().min(2, "Name is too short").max(60),
  description: z.string().trim().max(200).default(""),
  /** lucide-react icon name, e.g. "Bot". */
  icon: z
    .string()
    .trim()
    .max(40)
    .regex(/^[A-Z][A-Za-z0-9]*$/, "Use a lucide icon name like Bot or Palette")
    .default("Package"),
  sort: z.number().int().min(0).max(999).default(0),
  isActive: z.boolean().default(true),
});

export type StoreCategoryInput = z.input<typeof storeCategorySchema>;

export const updateStoreOrderStatusSchema = z.object({
  orderId: id,
  to: z.enum(["packed", "out_for_delivery", "delivered", "cancelled", "returned"]),
  courier: optionalText(60),
  trackingNumber: optionalText(80),
  cancelReason: optionalText(200),
});

export const updateStoreOrderDetailsSchema = z.object({
  orderId: id,
  courier: z.string().trim().max(60).default(""),
  trackingNumber: z.string().trim().max(80).default(""),
  adminNote: z.string().trim().max(1000).default(""),
});

export const refundStoreOrderSchema = z.object({
  orderId: id,
  note: z.string().trim().max(200).optional(),
});

export const storeSettingsSchema = z
  .object({
    isOpen: z.boolean(),
    /** Optional so an older form cannot reset them: omitted = keep the saved value. */
    defaultEtaMinDays: z.number().int().min(0).max(60).optional(),
    defaultEtaMaxDays: z.number().int().min(0).max(60).optional(),
    returnWindowDays: z.number().int().min(0).max(90).optional(),
    autoForward: z.boolean().optional(),
    closedMessage: z.string().trim().max(200).default(""),
    codEnabled: z.boolean(),
    codMaxPaise: paise.nullable().default(null),
    deliveryFeePaise: paise,
    freeDeliveryAbovePaise: paise.nullable().default(null),
    minOrderPaise: paise,
    /** "india" ships everywhere; "geofence" keeps to the service city and radius below. */
    serviceability: z.enum(["geofence", "india"]).default("india"),
    serviceCity: z.string().trim().min(2).max(60).default("Ranchi"),
    serviceLatitude: z.number().min(-90).max(90),
    serviceLongitude: z.number().min(-180).max(180),
    serviceRadiusKm: z.number().int().min(1).max(200),
    dispatchDays: z.number().int().min(0).max(30),
  })
  .refine((v) => v.defaultEtaMinDays == null || v.defaultEtaMaxDays == null || v.defaultEtaMinDays <= v.defaultEtaMaxDays, {
    message: "The longest estimate must be at least the shortest",
    path: ["defaultEtaMaxDays"],
  });

export type StoreSettingsInput = z.input<typeof storeSettingsSchema>;

// ─── Admin: shipping zones, partners, coupons, reviews, returns ──────

const pinPrefixList = z
  .array(z.string().trim())
  .max(500, "Too many PIN prefixes")
  .transform((list) => [...new Set(list.filter(Boolean))])
  .refine((list) => list.every(isValidPinPrefix), "PIN prefixes are 1 to 6 digits, e.g. 834 or 110001");

const stateList = z
  .array(z.string().trim())
  .max(40)
  .transform((list, ctx): IndianState[] => {
    const out = new Set<IndianState>();
    for (const raw of list) {
      if (!raw) continue;
      const state = normalizeIndianState(raw);
      if (!state) {
        ctx.addIssue({ code: "custom", message: `"${raw.slice(0, 40)}" is not an Indian state or union territory` });
        return z.NEVER;
      }
      out.add(state);
    }
    return [...out];
  });

export const storeShippingZoneSchema = z
  .object({
    /** Omit to create. */
    id: id.optional(),
    name: z.string().trim().min(2, "Name is too short").max(60),
    pinPrefixes: pinPrefixList.default([]),
    states: stateList.default([]),
    feePaise: paise,
    freeAbovePaise: paise.nullable().default(null),
    etaMinDays: z.number().int().min(0).max(60),
    etaMaxDays: z.number().int().min(0).max(60),
    codAllowed: z.boolean().default(true),
    isActive: z.boolean().default(true),
    sort: z.number().int().min(0).max(999).default(0),
  })
  .refine((v) => v.etaMinDays <= v.etaMaxDays, { message: "The longest estimate must be at least the shortest", path: ["etaMaxDays"] })
  .refine((v) => v.pinPrefixes.length > 0 || v.states.length > 0, { message: "Add at least one PIN prefix or state", path: ["pinPrefixes"] });

export type StoreShippingZoneInput = z.input<typeof storeShippingZoneSchema>;

export const storeZoneIdSchema = z.object({ zoneId: id });

export const storePartnerSchema = z.object({
  /** Omit to create. */
  id: id.optional(),
  name: z.string().trim().min(2, "Name is too short").max(80),
  contactName: z.string().trim().max(80).default(""),
  email: z.string().trim().toLowerCase().max(200).pipe(z.email("Enter a valid email")),
  phone: z.string().trim().max(20).default(""),
  coverageStates: stateList.default([]),
  coveragePinPrefixes: pinPrefixList.default([]),
  isActive: z.boolean().default(true),
  notes: z.string().trim().max(1000).default(""),
});

export type StorePartnerInput = z.input<typeof storePartnerSchema>;

export const storePartnerIdSchema = z.object({ partnerId: id });

export const forwardStoreOrderSchema = z.object({
  orderId: id,
  partnerId: id,
  /** Extra instructions for the partner, added to the email. */
  note: optionalText(300),
});

export const bulkForwardStoreOrdersSchema = z.object({
  orderIds: z.array(id).min(1, "Pick at least one order").max(50, "Forward up to 50 orders at a time"),
  /** Omit to send each order to its best-matching partner. */
  partnerId: id.optional(),
});

export const updateStoreOrderFulfilmentSchema = z.object({
  orderId: id,
  partnerRef: z.string().trim().max(80).default(""),
  partnerStatusNote: z.string().trim().max(500).default(""),
  courier: z.string().trim().max(60).default(""),
  trackingNumber: z.string().trim().max(80).default(""),
});

const optionalDate = z
  .union([z.date(), z.string().trim()])
  .nullable()
  .optional()
  .transform((v, ctx): Date | null => {
    if (v == null || v === "") return null;
    const d = v instanceof Date ? v : new Date(v);
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: "custom", message: "Enter a valid date" });
      return z.NEVER;
    }
    return d;
  });

export const storeCouponSchema = z
  .object({
    /** Omit to create. */
    id: id.optional(),
    code: couponCode,
    description: z.string().trim().max(160).default(""),
    kind: z.enum(STORE_COUPON_KINDS),
    /** percent: basis points (1000 = 10%). flat: paise. */
    value: z.number().int("Use a whole number").min(1, "Enter the discount").max(MAX_PAISE),
    minOrderPaise: paise.default(0),
    maxDiscountPaise: positivePaise.nullable().default(null),
    usageLimit: z.number().int().min(1).max(1_000_000).nullable().default(null),
    perUserLimit: z.number().int().min(1).max(1000).nullable().default(null),
    startsAt: optionalDate,
    endsAt: optionalDate,
    isActive: z.boolean().default(true),
  })
  .refine((v) => v.kind !== "percent" || v.value <= 10_000, { message: "A percent discount can't be more than 100%", path: ["value"] })
  .refine((v) => !v.startsAt || !v.endsAt || v.startsAt < v.endsAt, { message: "The end must be after the start", path: ["endsAt"] });

export type StoreCouponInput = z.input<typeof storeCouponSchema>;

export const storeCouponIdSchema = z.object({ couponId: id });

export const moderateStoreReviewSchema = z.object({
  reviewId: id,
  status: z.enum(STORE_REVIEW_STATUSES),
});

export const updateStoreReturnSchema = z.object({
  returnId: id,
  to: z.enum(["approved", "rejected", "received"]),
  /** Shown to the household (e.g. why it was declined). */
  note: optionalText(500),
  /** On `received`: put the units back on the shelf (off for damaged goods). */
  restock: z.boolean().default(true),
});

export const refundStoreReturnSchema = z.object({
  returnId: id,
  note: optionalText(200),
});

export const storeCollectionSchema = z.object({
  /** Omit to create. */
  id: id.optional(),
  title: z.string().trim().min(2, "Title is too short").max(60),
  /** Optional: derived from the title when blank. */
  slug: z.union([slug, z.literal("")]).optional(),
  subtitle: z.string().trim().max(140).default(""),
  image: imageUrl.nullable().default(null),
  isActive: z.boolean().default(true),
  sort: z.number().int().min(0).max(999).default(0),
  /** In rail order. Omit to leave the products as they are. */
  productIds: z.array(id).max(60, "Up to 60 products in a collection").optional(),
});

export type StoreCollectionInput = z.input<typeof storeCollectionSchema>;

export const storeCollectionIdSchema = z.object({ collectionId: id });

export const importStoreProductsSchema = z.object({
  csv: z.string().min(1, "Paste the CSV text").max(1_000_000, "That file is too large"),
  /** Validate and report only; write nothing. */
  dryRun: z.boolean().default(false),
});

export const bulkStockSchema = z
  .object({
    /** "set": make stock exactly qty. "add": add (or with a negative qty, remove) units. */
    mode: z.enum(["set", "add"]).default("set"),
    rows: z
      .array(z.object({ sku: z.string().trim().toUpperCase().min(1).max(40), qty: z.number().int().min(-100_000).max(100_000) }))
      .max(500, "Up to 500 rows at a time")
      .optional(),
    /** Alternative to `rows`: CSV text with `sku,stock` columns. */
    csv: z.string().max(200_000).optional(),
    note: optionalText(200),
  })
  .refine((v) => (v.rows && v.rows.length > 0) || (v.csv && v.csv.trim().length > 0), { message: "Add at least one row" });

export const storeExportOrdersSchema = z.object({
  status: z.enum(["all", "open", "refund_due", "to_forward", ...STORE_ORDER_STATUSES]).default("all"),
  /** IST dates, YYYY-MM-DD, inclusive. */
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// ─── Search params (queries) ─────────────────────────────────────────

const AGE_IDS = STORE_AGE_BANDS.map((b) => b.id) as string[];
const SORTS: StoreSort[] = ["featured", "new", "price_asc", "price_desc"];
const PRODUCT_FILTERS: AdminStoreProductFilter[] = ["all", "active", "inactive", "archived", "low", "out"];
const ORDER_FILTERS: AdminStoreOrderFilter[] = ["open", "all", "refund_due", "to_forward", ...STORE_ORDER_STATUSES];

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export function parseAgeBand(v: string | string[] | undefined): StoreAgeBandId | null {
  const s = first(v);
  return s && AGE_IDS.includes(s) ? (s as StoreAgeBandId) : null;
}

export function parseStoreSort(v: string | string[] | undefined): StoreSort {
  const s = first(v);
  return s && (SORTS as string[]).includes(s) ? (s as StoreSort) : "featured";
}

export function parseProductFilter(v: string | string[] | undefined): AdminStoreProductFilter {
  const s = first(v);
  return s && (PRODUCT_FILTERS as string[]).includes(s) ? (s as AdminStoreProductFilter) : "all";
}

export function parseOrderFilter(v: string | string[] | undefined): AdminStoreOrderFilter {
  const s = first(v);
  return s && (ORDER_FILTERS as string[]).includes(s) ? (s as AdminStoreOrderFilter) : "open";
}

export function parsePage(v: string | string[] | undefined): number {
  const n = Number(first(v));
  return Number.isInteger(n) && n >= 1 && n <= 10_000 ? n : 1;
}

export function parseSearch(v: string | string[] | undefined): string {
  return (first(v) ?? "").trim().slice(0, 80);
}

export function parseReviewFilter(v: string | string[] | undefined): StoreReviewStatus | "all" {
  const s = first(v);
  return s === "all" || (s && (STORE_REVIEW_STATUSES as readonly string[]).includes(s)) ? (s as StoreReviewStatus | "all") : "pending";
}

export function parseReturnFilter(v: string | string[] | undefined): StoreReturnStatus | "all" {
  const s = first(v);
  return s === "all" || (s && (STORE_RETURN_STATUSES as readonly string[]).includes(s)) ? (s as StoreReturnStatus | "all") : "requested";
}
