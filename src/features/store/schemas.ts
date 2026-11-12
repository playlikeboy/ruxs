import { z } from "zod";
import {
  STORE_AGE_BANDS,
  STORE_MAX_IMAGES,
  STORE_MAX_LINE_QTY,
  STORE_MAX_LINES,
  STORE_ORDER_STATUSES,
  STORE_PAYMENT_MODES,
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

// ─── Household ───────────────────────────────────────────────────────

export const bagItemSchema = z.object({
  productId: id,
  qty: z.number().int().min(1).max(STORE_MAX_LINE_QTY),
});

export const quoteBagSchema = z.object({
  items: z.array(bagItemSchema).max(STORE_MAX_LINES, "Your bag has too many items"),
});

export const placeStoreOrderSchema = z.object({
  clientKey: z.string().uuid(),
  items: z.array(bagItemSchema).min(1, "Your bag is empty").max(STORE_MAX_LINES, "Your bag has too many items"),
  paymentMode: z.enum(STORE_PAYMENT_MODES),
  notes: z.string().trim().max(300).optional(),
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

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

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
    closedMessage: z.string().trim().max(200).default(""),
    codEnabled: z.boolean(),
    codMaxPaise: paise.nullable().default(null),
    deliveryFeePaise: paise,
    freeDeliveryAbovePaise: paise.nullable().default(null),
    minOrderPaise: paise,
    /** "india" is not live yet; the action rejects it. */
    serviceability: z.enum(["geofence", "india"]).default("geofence"),
    serviceCity: z.string().trim().min(2).max(60).default("Ranchi"),
    serviceLatitude: z.number().min(-90).max(90),
    serviceLongitude: z.number().min(-180).max(180),
    serviceRadiusKm: z.number().int().min(1).max(200),
    dispatchDays: z.number().int().min(0).max(30),
  })
  .refine((v) => v.serviceability === "geofence", { message: "Pan-India shipping is coming soon", path: ["serviceability"] });

export type StoreSettingsInput = z.input<typeof storeSettingsSchema>;

// ─── Search params (queries) ─────────────────────────────────────────

const AGE_IDS = STORE_AGE_BANDS.map((b) => b.id) as string[];
const SORTS: StoreSort[] = ["featured", "new", "price_asc", "price_desc"];
const PRODUCT_FILTERS: AdminStoreProductFilter[] = ["all", "active", "inactive", "archived", "low", "out"];
const ORDER_FILTERS: AdminStoreOrderFilter[] = ["open", "all", "refund_due", ...STORE_ORDER_STATUSES];

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
