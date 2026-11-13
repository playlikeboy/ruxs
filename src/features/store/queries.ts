import "server-only";
import { cache } from "react";
import { and, asc, count, desc, eq, gte, ilike, inArray, isNotNull, isNull, lte, ne, or, sql, sum, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import {
  consumers,
  storeAuditLog,
  storeCategories,
  storeCollectionProducts,
  storeCollections,
  storeFulfilmentPartners,
  storeOrderItems,
  storeOrders,
  storePayments,
  storeProductReviews,
  storeProducts,
  storeStockAlerts,
  storeStockMovements,
  storeWishlist,
} from "@/db/schema";
import { requireAdmin, requireUser } from "@/lib/auth/session";
import { readGpsCookie } from "@/lib/location";
import { resolveCoordinates, type Coordinates } from "@/core/geo";
import { calculatePagination } from "@/core/pagination";
import { todayIST } from "@/core/time";
import {
  ageBandMatches,
  ageRangeLabel,
  canForwardStoreOrder,
  codAmountToCollect,
  discountPercent,
  etaLabel,
  isCodAllowed,
  isValidPincode,
  maxOrderQty,
  mergeBagLines,
  nextAdminStatuses,
  normalizeIndianMobile,
  normalizeIndianState,
  ratingAverage,
  resolveShippingZone,
  stockLabel,
  storeAgeBand,
  storeCartTotals,
  storeServiceability,
  STORE_MAX_LINES,
  type StoreOrderStatus,
  type StorePaymentMode,
  type StorePaymentStatus,
  type StoreReviewStatus,
  type StoreStockReason,
} from "@/core/store";
import { addressLine, loadProfile, type Profile } from "@/features/consumer/household";
import { getLocalities } from "@/features/platform/queries";
import { deliveredOrdersByProduct } from "./engagement";
import { suggestPartners } from "./fulfilment";
import { toAdminOrderRow, toAdminProductRow as toAdminRow, toAdminReturn, toOrderDetail, toOrderSummary, type StoreOrderRow } from "./mappers";
import { latestReturnsFor } from "./returns";
import { loadShippingZones, loadStoreSettings, toPublicSettings } from "./settings";
import { evaluateStoreCoupon } from "./settle";
import type {
  AdminAuditEntry,
  AdminStoreCategory,
  AdminStoreOrderDetail,
  AdminStoreOrderFilter,
  AdminStoreOrderList,
  AdminStoreOrderRow,
  AdminStoreOverview,
  AdminStoreProduct,
  AdminStoreProductDetail,
  AdminStoreProductFilter,
  AdminStoreProductList,
  MyStoreProductState,
  PublicStoreSettings,
  StoreAgeBandId,
  StoreBagQuote,
  StoreBagQuoteLine,
  StoreCategory,
  StoreCategoryPage,
  StoreCheckoutPrefill,
  StoreCollectionPage,
  StoreCollectionRail,
  StoreCouponQuote,
  StoreDeliveryCheck,
  StoreHome,
  StoreOrderDetail,
  StoreOrderItemView,
  StoreOrderSummary,
  StoreProductCard,
  StoreProductDetail,
  StoreRating,
  StoreReviewView,
  StoreSettings,
  StoreShippingQuote,
  StoreSort,
  StoreWishlistItem,
} from "./types";

type ProductRow = typeof storeProducts.$inferSelect;
type OrderRow = StoreOrderRow;

/** ILIKE pattern for free text; escapes %, _ and \\ so they match literally. */
function containsPattern(q: string) {
  return `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

/** In the household catalog: active and not archived. */
const inCatalog = and(eq(storeProducts.isActive, true), isNull(storeProducts.archivedAt));

// ─── Settings ────────────────────────────────────────────────────────

const loadSettings = cache(async () => loadStoreSettings(getDb()));

/** What households may see about the store (fees, COD, open/closed, city). */
export const getPublicStoreSettings = cache(async (): Promise<PublicStoreSettings> => toPublicSettings(await loadSettings()));

/** Full settings row for /admin/store/settings. Admin only. */
export async function getStoreSettings(): Promise<StoreSettings> {
  await requireAdmin();
  return loadSettings();
}

// ─── Mapping ─────────────────────────────────────────────────────────

const categoryNames = cache(async () => {
  const rows = await getDb().select({ id: storeCategories.id, name: storeCategories.name, icon: storeCategories.emojiIcon }).from(storeCategories);
  return new Map(rows.map((r) => [r.id, r]));
});

const NO_RATING: StoreRating = { average: null, count: 0 };

/** Average and count of PUBLISHED reviews per product. */
async function ratingsFor(productIds: string[]): Promise<Map<string, StoreRating>> {
  const out = new Map<string, StoreRating>();
  if (productIds.length === 0) return out;
  const rows = await getDb()
    .select({ productId: storeProductReviews.productId, n: count(), total: sum(storeProductReviews.rating) })
    .from(storeProductReviews)
    .where(and(inArray(storeProductReviews.productId, productIds), eq(storeProductReviews.status, "published")))
    .groupBy(storeProductReviews.productId);
  for (const r of rows) out.set(r.productId, { average: ratingAverage(Number(r.total ?? 0), r.n), count: r.n });
  return out;
}

function toCard(p: ProductRow, categoryName: string, rating: StoreRating = NO_RATING): StoreProductCard {
  const s = stockLabel(p.stock, p.lowStockAt);
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    tagline: p.tagline,
    brand: p.brand,
    categoryId: p.categoryId,
    categoryName,
    pricePaise: p.pricePaise,
    mrpPaise: p.mrpPaise,
    discountPercent: discountPercent(p.pricePaise, p.mrpPaise),
    image: p.images[0] ?? null,
    ageMin: p.ageMin,
    ageMax: p.ageMax,
    ageLabel: ageRangeLabel(p.ageMin, p.ageMax),
    skills: p.skills,
    isFeatured: p.isFeatured,
    stock: { kind: s.kind, label: s.label, maxQty: maxOrderQty(p.stock) },
    rating,
  };
}

async function toCards(rows: ProductRow[]): Promise<StoreProductCard[]> {
  const [names, ratings] = await Promise.all([categoryNames(), ratingsFor(rows.map((p) => p.id))]);
  return rows.map((p) => toCard(p, names.get(p.categoryId)?.name ?? "", ratings.get(p.id)));
}

function filterAge(rows: ProductRow[], age: StoreAgeBandId | null): ProductRow[] {
  const band = storeAgeBand(age);
  return band ? rows.filter((p) => ageBandMatches(p, band)) : rows;
}

/** In-stock first, then the chosen order. */
function sortProducts(rows: ProductRow[], sort: StoreSort): ProductRow[] {
  const out = [...rows];
  const inStock = (p: ProductRow) => (p.stock > 0 ? 0 : 1);
  out.sort((a, b) => {
    const s = inStock(a) - inStock(b);
    if (s !== 0) return s;
    switch (sort) {
      case "price_asc":
        return a.pricePaise - b.pricePaise;
      case "price_desc":
        return b.pricePaise - a.pricePaise;
      case "new":
        return b.createdAt.getTime() - a.createdAt.getTime();
      default:
        return Number(b.isFeatured) - Number(a.isFeatured) || b.createdAt.getTime() - a.createdAt.getTime();
    }
  });
  return out;
}

async function activeCategories(): Promise<StoreCategory[]> {
  const db = getDb();
  const [cats, counts] = await Promise.all([
    db.select().from(storeCategories).where(eq(storeCategories.isActive, true)).orderBy(asc(storeCategories.sort), asc(storeCategories.name)),
    db.select({ categoryId: storeProducts.categoryId, n: count() }).from(storeProducts).where(inCatalog).groupBy(storeProducts.categoryId),
  ]);
  const byCat = new Map(counts.map((c) => [c.categoryId, c.n]));
  return cats.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    icon: c.emojiIcon,
    sort: c.sort,
    isActive: c.isActive,
    productCount: byCat.get(c.id) ?? 0,
  }));
}

// ─── Household catalog ───────────────────────────────────────────────

/** Active collections with their in-catalog products (in rail order), skipping empty ones. */
async function collectionRails(visibleIds: Set<string> | null, perRail: number, age: StoreAgeBandId | null = null): Promise<StoreCollectionRail[]> {
  const db = getDb();
  const cols = await db.select().from(storeCollections).where(eq(storeCollections.isActive, true)).orderBy(asc(storeCollections.sort), asc(storeCollections.title));
  if (cols.length === 0) return [];
  const links = await db
    .select({ collectionId: storeCollectionProducts.collectionId, p: storeProducts })
    .from(storeCollectionProducts)
    .innerJoin(storeProducts, eq(storeCollectionProducts.productId, storeProducts.id))
    .where(and(inArray(storeCollectionProducts.collectionId, cols.map((c) => c.id)), inCatalog))
    .orderBy(asc(storeCollectionProducts.sort), asc(storeProducts.name));
  const byCol = new Map<string, ProductRow[]>();
  for (const l of links) {
    if (visibleIds && !visibleIds.has(l.p.id)) continue;
    const list = byCol.get(l.collectionId) ?? [];
    list.push(l.p);
    byCol.set(l.collectionId, list);
  }
  const rails: StoreCollectionRail[] = [];
  for (const c of cols) {
    const rows = filterAge(byCol.get(c.id) ?? [], age).slice(0, perRail);
    if (rows.length === 0) continue;
    rails.push({ id: c.id, slug: c.slug, title: c.title, subtitle: c.subtitle, image: c.image, products: await toCards(rows) });
  }
  return rails;
}

/** /app/kids/shop: curated rails, featured strip, category chips, new arrivals and the (age-filtered) grid. */
export async function getStoreHome(opts: { age?: StoreAgeBandId | null } = {}): Promise<StoreHome> {
  const db = getDb();
  const age = opts.age ?? null;
  const [settings, categories, rows] = await Promise.all([
    getPublicStoreSettings(),
    activeCategories(),
    db.select().from(storeProducts).where(inCatalog).orderBy(desc(storeProducts.createdAt)).limit(500),
  ]);
  const activeCats = new Set(categories.map((c) => c.id));
  const inActiveCats = rows.filter((p) => activeCats.has(p.categoryId));
  const visible = filterAge(inActiveCats, age);
  const featured = sortProducts(visible.filter((p) => p.isFeatured), "featured").slice(0, 8);
  const newArrivals = sortProducts(visible, "new").slice(0, 8);
  const products = sortProducts(visible, "featured").slice(0, 60);
  const [f, n, p, collections] = await Promise.all([
    toCards(featured),
    toCards(newArrivals),
    toCards(products),
    collectionRails(new Set(inActiveCats.map((r) => r.id)), 12, age),
  ]);
  return { settings, collections, categories, featured: f, newArrivals: n, products: p, age };
}

/** /app/kids/shop/c/[slug]: one curated collection. Null when missing, hidden or empty. `curated` keeps the admin's order. */
export async function getStoreCollection(
  slug: string,
  opts: { age?: StoreAgeBandId | null; sort?: StoreSort | "curated" } = {}
): Promise<StoreCollectionPage | null> {
  const db = getDb();
  const age = opts.age ?? null;
  const sort = opts.sort ?? "curated";
  const [c] = await db.select().from(storeCollections).where(and(eq(storeCollections.slug, slug), eq(storeCollections.isActive, true))).limit(1);
  if (!c) return null;
  const [settings, links] = await Promise.all([
    getPublicStoreSettings(),
    db
      .select({ p: storeProducts })
      .from(storeCollectionProducts)
      .innerJoin(storeProducts, eq(storeCollectionProducts.productId, storeProducts.id))
      .innerJoin(storeCategories, eq(storeProducts.categoryId, storeCategories.id))
      .where(and(eq(storeCollectionProducts.collectionId, c.id), inCatalog, eq(storeCategories.isActive, true)))
      .orderBy(asc(storeCollectionProducts.sort), asc(storeProducts.name)),
  ]);
  if (links.length === 0) return null;
  const rows = filterAge(links.map((l) => l.p), age);
  const products = await toCards(sort === "curated" ? rows : sortProducts(rows, sort));
  return { settings, collection: { id: c.id, slug: c.slug, title: c.title, subtitle: c.subtitle, image: c.image, products }, age, sort };
}

/** /app/kids/shop/[category]. Null when the category is missing or hidden. */
export async function getStoreCategory(
  slug: string,
  opts: { age?: StoreAgeBandId | null; sort?: StoreSort } = {}
): Promise<StoreCategoryPage | null> {
  const db = getDb();
  const age = opts.age ?? null;
  const sort = opts.sort ?? "featured";
  const [settings, categories] = await Promise.all([getPublicStoreSettings(), activeCategories()]);
  const category = categories.find((c) => c.id === slug);
  if (!category) return null;
  const rows = await db.select().from(storeProducts).where(and(inCatalog, eq(storeProducts.categoryId, slug)));
  const products = (await toCards(sortProducts(filterAge(rows, age), sort))).map((c) => ({ ...c, categoryName: category.name }));
  return { settings, category, categories, products, age, sort };
}

/** /app/kids/shop/p/[slug]. Null when missing, inactive, archived or its category is hidden. */
export async function getStoreProduct(slug: string): Promise<StoreProductDetail | null> {
  const db = getDb();
  const [row] = await db
    .select({ p: storeProducts, c: storeCategories })
    .from(storeProducts)
    .innerJoin(storeCategories, eq(storeProducts.categoryId, storeCategories.id))
    .where(and(eq(storeProducts.slug, slug), inCatalog, eq(storeCategories.isActive, true)))
    .limit(1);
  if (!row) return null;
  const { p, c } = row;
  const [relatedRows, reviewRows, breakdownRows] = await Promise.all([
    db
      .select()
      .from(storeProducts)
      .where(and(inCatalog, eq(storeProducts.categoryId, p.categoryId), ne(storeProducts.id, p.id)))
      .orderBy(desc(storeProducts.isFeatured), desc(storeProducts.createdAt))
      .limit(8),
    db
      .select({ r: storeProductReviews, name: consumers.name })
      .from(storeProductReviews)
      .leftJoin(consumers, eq(consumers.userId, storeProductReviews.userId))
      .where(and(eq(storeProductReviews.productId, p.id), eq(storeProductReviews.status, "published")))
      .orderBy(desc(storeProductReviews.createdAt))
      .limit(20),
    db
      .select({ rating: storeProductReviews.rating, n: count() })
      .from(storeProductReviews)
      .where(and(eq(storeProductReviews.productId, p.id), eq(storeProductReviews.status, "published")))
      .groupBy(storeProductReviews.rating),
  ]);
  const related = sortProducts(relatedRows, "featured").slice(0, 4);
  const ratings = await ratingsFor([p.id, ...related.map((r) => r.id)]);
  const ratingBreakdown: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  for (const b of breakdownRows) if (b.rating >= 1 && b.rating <= 5) ratingBreakdown[b.rating - 1] = b.n;
  const reviews: StoreReviewView[] = reviewRows.map(({ r, name }) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    // First name only: a review never shows a household's full name.
    authorName: name?.trim().split(/\s+/)[0] || "RUXs customer",
    createdAt: r.createdAt,
  }));
  return {
    ...toCard(p, c.name, ratings.get(p.id)),
    description: p.description,
    images: p.images,
    boxContents: p.boxContents,
    safetyNotes: p.safetyNotes,
    weightGrams: p.weightGrams,
    gstBps: p.gstBps,
    category: { id: c.id, name: c.name, icon: c.emojiIcon },
    related: related.map((r) => toCard(r, c.name, ratings.get(r.id))),
    reviews,
    ratingBreakdown,
  };
}

/** Wishlist, back-in-stock and review state of one product for the signed-in household. */
export async function getMyStoreProductState(productId: string): Promise<MyStoreProductState> {
  const user = await requireUser();
  const db = getDb();
  const [[wish], [alert], [review], delivered] = await Promise.all([
    db.select({ productId: storeWishlist.productId }).from(storeWishlist).where(and(eq(storeWishlist.userId, user.id), eq(storeWishlist.productId, productId))).limit(1),
    db
      .select({ productId: storeStockAlerts.productId })
      .from(storeStockAlerts)
      .where(and(eq(storeStockAlerts.userId, user.id), eq(storeStockAlerts.productId, productId), isNull(storeStockAlerts.notifiedAt)))
      .limit(1),
    db.select().from(storeProductReviews).where(and(eq(storeProductReviews.userId, user.id), eq(storeProductReviews.productId, productId))).limit(1),
    deliveredOrdersByProduct(db, user.id, [productId]),
  ]);
  return {
    wishlisted: !!wish,
    stockAlert: !!alert,
    canReview: delivered.has(productId) && !review,
    myReview: review
      ? { id: review.id, rating: review.rating, title: review.title, body: review.body, status: review.status as StoreReviewStatus, createdAt: review.createdAt }
      : null,
  };
}

/** Product ids on my wishlist, for the heart state on product grids. */
export async function getMyStoreWishlistIds(): Promise<string[]> {
  const user = await requireUser();
  const rows = await getDb().select({ productId: storeWishlist.productId }).from(storeWishlist).where(eq(storeWishlist.userId, user.id));
  return rows.map((r) => r.productId);
}

/** /app/kids/shop/wishlist: my saved products that are still sold, newest first. */
export async function getMyStoreWishlist(): Promise<StoreWishlistItem[]> {
  const user = await requireUser();
  const db = getDb();
  const [rows, alerts] = await Promise.all([
    db
      .select({ p: storeProducts, addedAt: storeWishlist.createdAt })
      .from(storeWishlist)
      .innerJoin(storeProducts, eq(storeWishlist.productId, storeProducts.id))
      .innerJoin(storeCategories, eq(storeProducts.categoryId, storeCategories.id))
      .where(and(eq(storeWishlist.userId, user.id), inCatalog, eq(storeCategories.isActive, true)))
      .orderBy(desc(storeWishlist.createdAt))
      .limit(200),
    db
      .select({ productId: storeStockAlerts.productId })
      .from(storeStockAlerts)
      .where(and(eq(storeStockAlerts.userId, user.id), isNull(storeStockAlerts.notifiedAt))),
  ]);
  const alertIds = new Set(alerts.map((a) => a.productId));
  const cards = await toCards(rows.map((r) => r.p));
  return cards.map((c, i) => ({ ...c, addedAt: rows[i]!.addedAt, stockAlert: alertIds.has(c.id) }));
}

// ─── Delivery check / bag quote ──────────────────────────────────────

/**
 * Where a store order goes: the address pin, else the address's locality
 * centre, else the phone's last GPS fix. Null when none is known.
 */
export async function resolveStoreDeliveryPoint(profile: Profile): Promise<Coordinates | null> {
  if (profile.latitude != null && profile.longitude != null) return { latitude: profile.latitude, longitude: profile.longitude };
  const fromAddress = resolveCoordinates(profile.city, profile.area, await getLocalities());
  if (fromAddress) return fromAddress;
  return readGpsCookie();
}

async function deliveryCheckFor(userId: string | null, settings: StoreSettings): Promise<StoreDeliveryCheck | null> {
  if (!userId) return null;
  const profile = await loadProfile(userId);
  const india = settings.serviceability === "india";
  if (!profile) {
    return {
      hasProfile: false,
      name: null,
      phone: null,
      address: null,
      // Pan-India checkout takes the address on the order itself: no saved profile needed.
      serviceable: india,
      message: india ? null : "Add your delivery address to check out",
    };
  }
  const reach = india ? ({ ok: true } as const) : storeServiceability(await resolveStoreDeliveryPoint(profile), settings);
  return {
    hasProfile: true,
    name: profile.name,
    phone: profile.phone,
    address: addressLine(profile),
    serviceable: reach.ok,
    message: reach.ok ? null : reach.message,
  };
}

/**
 * Starting values for the checkout address form: my last store order's ship-to
 * address, else my RUXs profile (which has no PIN code or state), else blank.
 */
export async function getMyStoreCheckoutPrefill(): Promise<StoreCheckoutPrefill> {
  const user = await requireUser();
  const db = getDb();
  const [[last], profile] = await Promise.all([
    db
      .select({
        name: storeOrders.customerName,
        phone: storeOrders.phone,
        line1: storeOrders.shipLine1,
        line2: storeOrders.shipLine2,
        landmark: storeOrders.shipLandmark,
        city: storeOrders.shipCity,
        state: storeOrders.shipState,
        pincode: storeOrders.shipPincode,
      })
      .from(storeOrders)
      .where(and(eq(storeOrders.userId, user.id), isNotNull(storeOrders.shipPincode)))
      .orderBy(desc(storeOrders.createdAt))
      .limit(1),
    loadProfile(user.id),
  ]);
  const email = user.primaryEmail ?? profile?.email ?? null;
  if (last?.line1 && last.city && last.pincode) {
    return {
      source: "last_order",
      name: last.name,
      phone: last.phone,
      line1: last.line1,
      line2: last.line2 ?? "",
      landmark: last.landmark ?? "",
      city: last.city,
      state: normalizeIndianState(last.state) ?? "",
      pincode: last.pincode,
      email,
    };
  }
  if (profile) {
    return {
      source: "profile",
      name: profile.name,
      phone: normalizeIndianMobile(profile.phone) ?? profile.phone,
      line1: [profile.flat, profile.floor && `Floor ${profile.floor}`, profile.tower && `Tower ${profile.tower}`, profile.society].filter(Boolean).join(", "),
      line2: profile.area,
      landmark: profile.landmark ?? "",
      city: profile.city,
      state: "",
      pincode: "",
      email,
    };
  }
  return { source: "none", name: "", phone: "", line1: "", line2: "", landmark: "", city: "", state: "", pincode: "", email };
}

/**
 * Server-side price, stock, delivery and coupon check for the localStorage bag.
 * The server is the source of truth: unknown/archived items are removed and
 * quantities are capped to stock. Pass the destination PIN code (and state) to
 * price delivery by shipping zone, `couponCode` to try a code, and `userId` to
 * include the saved-profile check and per-household coupon limits.
 */
export async function quoteStoreBag(
  items: { productId: string; qty: number }[],
  opts: { userId?: string | null; pincode?: string | null; state?: string | null; couponCode?: string | null } = {}
): Promise<StoreBagQuote> {
  const db = getDb();
  const lines = mergeBagLines(items).slice(0, STORE_MAX_LINES);
  const settings = await loadSettings();
  const ids = lines.map((l) => l.productId);
  const [rows, delivery, zones] = await Promise.all([
    ids.length
      ? db
          .select({ p: storeProducts, catActive: storeCategories.isActive })
          .from(storeProducts)
          .innerJoin(storeCategories, eq(storeProducts.categoryId, storeCategories.id))
          .where(inArray(storeProducts.id, ids))
      : Promise.resolve([]),
    deliveryCheckFor(opts.userId ?? null, settings),
    loadShippingZones(db),
  ]);
  const byId = new Map(rows.map((r) => [r.p.id, r]));

  const removedProductIds: string[] = [];
  const quoteLines: StoreBagQuoteLine[] = [];
  for (const l of lines) {
    const r = byId.get(l.productId);
    if (!r) {
      removedProductIds.push(l.productId);
      continue;
    }
    const p = r.p;
    const s = stockLabel(p.stock, p.lowStockAt);
    const stock = { kind: s.kind, label: s.label, maxQty: maxOrderQty(p.stock) };
    const unavailable = !p.isActive || !!p.archivedAt || !r.catActive;
    const qty = unavailable ? 0 : Math.min(l.qty, stock.maxQty);
    const issue: StoreBagQuoteLine["issue"] = unavailable ? "unavailable" : stock.maxQty === 0 ? "out_of_stock" : qty < l.qty ? "qty_reduced" : null;
    quoteLines.push({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      image: p.images[0] ?? null,
      unitPricePaise: p.pricePaise,
      mrpPaise: p.mrpPaise,
      requestedQty: l.qty,
      qty,
      lineTotalPaise: p.pricePaise * qty,
      stock,
      issue,
    });
  }

  // Destination: fee, estimate and COD come from the shipping zone of the PIN code.
  const pinText = opts.pincode?.trim() ?? "";
  const pincode = isValidPincode(pinText) ? pinText : null;
  const state = normalizeIndianState(opts.state);
  const zone = resolveShippingZone({ pincode, state }, zones, settings);
  const shipping: StoreShippingQuote = {
    resolved: pincode != null,
    pincode,
    state,
    feePaise: zone.feePaise,
    freeAbovePaise: zone.freeAbovePaise,
    etaMinDays: zone.etaMinDays,
    etaMaxDays: zone.etaMaxDays,
    etaLabel: etaLabel(zone.etaMinDays, zone.etaMaxDays),
    codAllowed: zone.codAllowed,
  };
  const fees = { deliveryFeePaise: zone.feePaise, freeDeliveryAbovePaise: zone.freeAbovePaise };

  const buyable = quoteLines.filter((l) => l.qty > 0);
  const pricedLines = buyable.map((l) => ({ unitPricePaise: l.unitPricePaise, qty: l.qty }));
  const subtotalPaise = storeCartTotals(pricedLines, fees).subtotalPaise;

  let coupon: StoreCouponQuote | null = null;
  if (opts.couponCode && opts.couponCode.trim()) {
    const code = opts.couponCode.trim().toUpperCase();
    const evaluated = buyable.length
      ? await evaluateStoreCoupon(db, { code, userId: opts.userId ?? null, subtotalPaise, now: new Date() })
      : null;
    if (!evaluated) {
      coupon = { code, applied: false, discountPaise: 0, message: buyable.length ? "That code is not valid" : "Add items to use a code", description: "" };
    } else if (!evaluated.check.ok) {
      coupon = { code: evaluated.coupon.code, applied: false, discountPaise: 0, message: evaluated.check.message, description: evaluated.coupon.description };
    } else {
      coupon = { code: evaluated.coupon.code, applied: true, discountPaise: evaluated.check.discountPaise, message: null, description: evaluated.coupon.description };
    }
  }

  const totals = storeCartTotals(pricedLines, fees, coupon?.applied ? coupon.discountPaise : 0);
  const paymentModes: StorePaymentMode[] = ["online"];
  if (zone.codAllowed && isCodAllowed(totals.totalPaise, settings)) paymentModes.push("cod");

  const blockers: string[] = [];
  if (!settings.isOpen) blockers.push(settings.closedMessage || "The RUXs Store is closed right now");
  if (buyable.length === 0) blockers.push("Your bag is empty");
  else if (totals.subtotalPaise < settings.minOrderPaise) blockers.push("Add a few more items to reach the minimum order");
  if (pinText && !pincode) blockers.push("Enter a valid 6-digit PIN code");
  if (delivery && !delivery.serviceable && delivery.message) blockers.push(delivery.message);

  return {
    lines: quoteLines,
    removedProductIds,
    subtotalPaise: totals.subtotalPaise,
    deliveryFeePaise: totals.deliveryFeePaise,
    discountPaise: totals.discountPaise,
    totalPaise: totals.totalPaise,
    itemCount: totals.itemCount,
    freeDeliveryGapPaise: totals.freeDeliveryGapPaise,
    settings: toPublicSettings(settings),
    paymentModes,
    changed: removedProductIds.length > 0 || quoteLines.some((l) => l.issue !== null),
    blockers,
    coupon,
    shipping,
    delivery,
  };
}

// ─── Household orders ────────────────────────────────────────────────

async function itemsFor(orderIds: string[]) {
  if (orderIds.length === 0) return new Map<string, StoreOrderItemView[]>();
  const rows = await getDb()
    .select({ item: storeOrderItems, slug: storeProducts.slug })
    .from(storeOrderItems)
    .leftJoin(storeProducts, eq(storeOrderItems.productId, storeProducts.id))
    .where(inArray(storeOrderItems.orderId, orderIds))
    .orderBy(asc(storeOrderItems.name));
  const out = new Map<string, StoreOrderItemView[]>();
  for (const r of rows) {
    const list = out.get(r.item.orderId) ?? [];
    list.push({
      id: r.item.id,
      productId: r.item.productId,
      productSlug: r.slug,
      name: r.item.name,
      image: r.item.image,
      unitPricePaise: r.item.unitPricePaise,
      qty: r.item.qty,
      lineTotalPaise: r.item.lineTotalPaise,
      canReview: false,
      myRating: null,
    });
    out.set(r.item.orderId, list);
  }
  return out;
}

/** The signed-in household's store orders, newest first (up to 50). */
export async function getMyStoreOrders(): Promise<StoreOrderSummary[]> {
  const user = await requireUser();
  const rows = await getDb()
    .select()
    .from(storeOrders)
    .where(eq(storeOrders.userId, user.id))
    .orderBy(desc(storeOrders.createdAt))
    .limit(50);
  const items = await itemsFor(rows.map((r) => r.id));
  return rows.map((o) => toOrderSummary(o, items.get(o.id) ?? []));
}

/** One of my store orders; null when it is not mine or does not exist. */
export async function getMyStoreOrder(orderId: string): Promise<StoreOrderDetail | null> {
  const user = await requireUser();
  const db = getDb();
  const [o] = await db
    .select()
    .from(storeOrders)
    .where(and(eq(storeOrders.id, orderId), eq(storeOrders.userId, user.id)))
    .limit(1);
  if (!o) return null;
  const [itemMap, settings, returns] = await Promise.all([itemsFor([o.id]), loadSettings(), latestReturnsFor(db, [o.id])]);
  let items = itemMap.get(o.id) ?? [];
  if (o.status === "delivered" && items.length > 0) {
    const mine = await db
      .select({ productId: storeProductReviews.productId, rating: storeProductReviews.rating })
      .from(storeProductReviews)
      .where(and(eq(storeProductReviews.userId, user.id), inArray(storeProductReviews.productId, items.map((i) => i.productId))));
    const rated = new Map(mine.map((r) => [r.productId, r.rating]));
    items = items.map((i) => ({ ...i, canReview: !rated.has(i.productId), myRating: rated.get(i.productId) ?? null }));
  }
  return toOrderDetail(o, items, { dispatchDays: settings.dispatchDays, returnWindowDays: settings.returnWindowDays, returnRequest: returns.get(o.id) ?? null });
}

// ─── Admin ───────────────────────────────────────────────────────────

function productFilterWhere(filter: AdminStoreProductFilter): SQL | undefined {
  const live = isNull(storeProducts.archivedAt);
  switch (filter) {
    case "active":
      return and(live, eq(storeProducts.isActive, true));
    case "inactive":
      return and(live, eq(storeProducts.isActive, false));
    case "archived":
      return isNotNull(storeProducts.archivedAt);
    case "low":
      return and(live, sql`${storeProducts.stock} > 0`, lte(storeProducts.stock, storeProducts.lowStockAt));
    case "out":
      return and(live, eq(storeProducts.stock, 0));
    default:
      return live;
  }
}

const PRODUCT_FILTERS: AdminStoreProductFilter[] = ["all", "active", "inactive", "archived", "low", "out"];

/** /admin/store/products. `all` = not archived. Search matches name, SKU and brand. */
export async function getAdminStoreProducts(
  opts: { q?: string; category?: string | null; filter?: AdminStoreProductFilter; page?: number } = {}
): Promise<AdminStoreProductList> {
  await requireAdmin();
  const db = getDb();
  const filter = opts.filter ?? "all";
  const q = opts.q?.trim();
  const search = q
    ? or(ilike(storeProducts.name, containsPattern(q)), ilike(storeProducts.sku, containsPattern(q)), ilike(storeProducts.brand, containsPattern(q)))
    : undefined;
  const cat = opts.category ? eq(storeProducts.categoryId, opts.category) : undefined;
  const base = and(search, cat);
  const where = and(base, productFilterWhere(filter));

  const [[totalRow], countRows, cats] = await Promise.all([
    db.select({ n: count() }).from(storeProducts).where(where),
    Promise.all(PRODUCT_FILTERS.map((f) => db.select({ n: count() }).from(storeProducts).where(and(base, productFilterWhere(f))))),
    db.select({ id: storeCategories.id, name: storeCategories.name }).from(storeCategories).orderBy(asc(storeCategories.sort)),
  ]);
  const total = totalRow?.n ?? 0;
  const pg = calculatePagination(total, { page: opts.page, defaultPageSize: 25, maxPageSize: 100 });
  const rows = await db
    .select()
    .from(storeProducts)
    .where(where)
    .orderBy(desc(storeProducts.updatedAt))
    .limit(pg.pageSize)
    .offset(pg.offset);
  const names = new Map(cats.map((c) => [c.id, c.name]));
  const counts = Object.fromEntries(PRODUCT_FILTERS.map((f, i) => [f, countRows[i]?.[0]?.n ?? 0])) as Record<AdminStoreProductFilter, number>;
  return {
    rows: rows.map((p) => toAdminRow(p, names.get(p.categoryId) ?? p.categoryId)),
    total,
    page: pg.page,
    pageSize: pg.pageSize,
    totalPages: pg.totalPages,
    counts,
    categories: cats,
  };
}

/** /admin/store/products/[id]: the full product, recent stock movements and categories. */
export async function getAdminStoreProduct(productId: string): Promise<AdminStoreProductDetail | null> {
  await requireAdmin();
  const db = getDb();
  const [p] = await db.select().from(storeProducts).where(eq(storeProducts.id, productId)).limit(1);
  if (!p) return null;
  const [moves, cats, [sold]] = await Promise.all([
    db
      .select({ m: storeStockMovements, orderNumber: storeOrders.orderNumber })
      .from(storeStockMovements)
      .leftJoin(storeOrders, eq(storeStockMovements.orderId, storeOrders.id))
      .where(eq(storeStockMovements.productId, p.id))
      .orderBy(desc(storeStockMovements.createdAt))
      .limit(30),
    db
      .select({ id: storeCategories.id, name: storeCategories.name, isActive: storeCategories.isActive })
      .from(storeCategories)
      .orderBy(asc(storeCategories.sort)),
    db
      .select({ n: sum(storeOrderItems.qty) })
      .from(storeOrderItems)
      .innerJoin(storeOrders, eq(storeOrderItems.orderId, storeOrders.id))
      .where(and(eq(storeOrderItems.productId, p.id), ne(storeOrders.status, "cancelled"))),
  ]);
  const product: AdminStoreProduct = {
    id: p.id,
    slug: p.slug,
    categoryId: p.categoryId,
    name: p.name,
    tagline: p.tagline,
    description: p.description,
    brand: p.brand,
    sku: p.sku,
    pricePaise: p.pricePaise,
    mrpPaise: p.mrpPaise,
    gstBps: p.gstBps,
    stock: p.stock,
    lowStockAt: p.lowStockAt,
    ageMin: p.ageMin,
    ageMax: p.ageMax,
    skills: p.skills,
    boxContents: p.boxContents,
    safetyNotes: p.safetyNotes,
    images: p.images,
    weightGrams: p.weightGrams,
    isFeatured: p.isFeatured,
    isActive: p.isActive,
    archivedAt: p.archivedAt,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
  return {
    product,
    movements: moves.map(({ m, orderNumber }) => ({
      id: m.id,
      delta: m.delta,
      stockAfter: m.stockAfter,
      reason: m.reason as StoreStockReason,
      orderId: m.orderId,
      orderNumber,
      actor: m.actor,
      note: m.note,
      createdAt: m.createdAt,
    })),
    categories: cats,
    unitsSold: Number(sold?.n ?? 0),
  };
}

function orderFilterWhere(filter: AdminStoreOrderFilter): SQL | undefined {
  switch (filter) {
    case "all":
      return undefined;
    case "open":
      return inArray(storeOrders.status, ["placed", "packed", "out_for_delivery"]);
    case "refund_due":
      return eq(storeOrders.paymentStatus, "refund_due");
    case "to_forward":
      return and(inArray(storeOrders.status, ["placed", "packed"]), isNull(storeOrders.partnerId));
    default:
      return eq(storeOrders.status, filter);
  }
}

const ORDER_FILTERS: AdminStoreOrderFilter[] = [
  "open",
  "all",
  "refund_due",
  "to_forward",
  "awaiting_payment",
  "placed",
  "packed",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
];

async function toAdminOrderRows(rows: OrderRow[]): Promise<AdminStoreOrderRow[]> {
  const partnerIds = [...new Set(rows.map((r) => r.partnerId).filter((v): v is string => !!v))];
  const [items, partners] = await Promise.all([
    itemsFor(rows.map((r) => r.id)),
    partnerIds.length
      ? getDb().select({ id: storeFulfilmentPartners.id, name: storeFulfilmentPartners.name }).from(storeFulfilmentPartners).where(inArray(storeFulfilmentPartners.id, partnerIds))
      : Promise.resolve([]),
  ]);
  const names = new Map(partners.map((p) => [p.id, p.name]));
  return rows.map((o) =>
    toAdminOrderRow(
      o,
      (items.get(o.id) ?? []).reduce((n, i) => n + i.qty, 0),
      o.partnerId ? (names.get(o.partnerId) ?? null) : null
    )
  );
}

/** /admin/store/orders. Search matches order number, name, phone and PIN code. Default filter `open`. */
export async function getAdminStoreOrders(
  opts: { status?: AdminStoreOrderFilter; q?: string; page?: number } = {}
): Promise<AdminStoreOrderList> {
  await requireAdmin();
  const db = getDb();
  const status = opts.status ?? "open";
  const q = opts.q?.trim();
  const search = q
    ? or(
        ilike(storeOrders.orderNumber, containsPattern(q)),
        ilike(storeOrders.customerName, containsPattern(q)),
        ilike(storeOrders.phone, containsPattern(q)),
        ilike(storeOrders.shipPincode, containsPattern(q))
      )
    : undefined;
  const where = and(search, orderFilterWhere(status));
  const [[totalRow], countRows, partners] = await Promise.all([
    db.select({ n: count() }).from(storeOrders).where(where),
    Promise.all(ORDER_FILTERS.map((f) => db.select({ n: count() }).from(storeOrders).where(and(search, orderFilterWhere(f))))),
    db
      .select({ id: storeFulfilmentPartners.id, name: storeFulfilmentPartners.name })
      .from(storeFulfilmentPartners)
      .where(eq(storeFulfilmentPartners.isActive, true))
      .orderBy(asc(storeFulfilmentPartners.name)),
  ]);
  const total = totalRow?.n ?? 0;
  const pg = calculatePagination(total, { page: opts.page, defaultPageSize: 25, maxPageSize: 100 });
  const rows = await db.select().from(storeOrders).where(where).orderBy(desc(storeOrders.createdAt)).limit(pg.pageSize).offset(pg.offset);
  const counts = Object.fromEntries(ORDER_FILTERS.map((f, i) => [f, countRows[i]?.[0]?.n ?? 0])) as Record<AdminStoreOrderFilter, number>;
  return { rows: await toAdminOrderRows(rows), total, page: pg.page, pageSize: pg.pageSize, totalPages: pg.totalPages, counts, partners };
}

/** /admin/store/orders/[id]: full order with payments, fulfilment partner, return and audit trail. */
export async function getAdminStoreOrder(orderId: string): Promise<AdminStoreOrderDetail | null> {
  await requireAdmin();
  const db = getDb();
  const [row] = await db
    .select({ o: storeOrders, email: consumers.email, partner: storeFulfilmentPartners })
    .from(storeOrders)
    .leftJoin(consumers, eq(consumers.userId, storeOrders.userId))
    .leftJoin(storeFulfilmentPartners, eq(storeFulfilmentPartners.id, storeOrders.partnerId))
    .where(eq(storeOrders.id, orderId))
    .limit(1);
  if (!row) return null;
  const o = row.o;
  const [items, pays, settings, returns, suggestions, auditRows] = await Promise.all([
    itemsFor([o.id]),
    db.select().from(storePayments).where(eq(storePayments.orderId, o.id)).orderBy(desc(storePayments.createdAt)),
    loadSettings(),
    latestReturnsFor(db, [o.id]),
    suggestPartners(db, { pincode: o.shipPincode, state: o.shipState }),
    db
      .select()
      .from(storeAuditLog)
      .where(and(eq(storeAuditLog.entity, "order"), eq(storeAuditLog.entityId, o.id)))
      .orderBy(desc(storeAuditLog.createdAt))
      .limit(30),
  ]);
  const status = o.status as StoreOrderStatus;
  const paymentStatus = o.paymentStatus as StorePaymentStatus;
  const returnRow = returns.get(o.id) ?? null;
  const audit: AdminAuditEntry[] = auditRows.map((a) => ({
    id: a.id,
    actorUserId: a.actorUserId,
    action: a.action,
    entity: a.entity,
    entityId: a.entityId,
    data: a.data,
    createdAt: a.createdAt,
  }));
  return {
    ...toOrderDetail(o, items.get(o.id) ?? [], { dispatchDays: settings.dispatchDays, returnWindowDays: settings.returnWindowDays, returnRequest: returnRow }),
    // The seller portal sees the real courier; the household shape always carries null.
    courier: o.courier,
    userId: o.userId,
    adminNote: o.adminNote,
    latitude: o.latitude,
    longitude: o.longitude,
    email: o.customerEmail ?? row.email,
    payments: pays.map((p) => ({
      id: p.id,
      razorpayOrderId: p.razorpayOrderId,
      razorpayPaymentId: p.razorpayPaymentId,
      amountPaise: p.amountPaise,
      status: p.status as "created" | "paid" | "failed",
      failureReason: p.failureReason,
      refundId: p.refundId,
      paidAt: p.paidAt,
      refundedAt: p.refundedAt,
      createdAt: p.createdAt,
    })),
    nextStatuses: nextAdminStatuses(status),
    canRefund: (paymentStatus === "paid" || paymentStatus === "refund_due") && (status === "cancelled" || status === "returned"),
    updatedAt: o.updatedAt,
    zoneName: o.zoneName,
    codToCollectPaise: codAmountToCollect({ paymentMode: o.paymentMode as StorePaymentMode, paymentStatus, totalPaise: o.totalPaise }),
    fulfilment: {
      partnerId: o.partnerId,
      partnerName: row.partner?.name ?? null,
      partnerEmail: row.partner?.email ?? null,
      forwardedAt: o.forwardedAt,
      forwardEmailedAt: o.forwardEmailedAt,
      partnerRef: o.partnerRef,
      partnerStatusNote: o.partnerStatusNote,
      canForward: canForwardStoreOrder(status),
      suggestions,
    },
    adminReturn: returnRow ? toAdminReturn(returnRow, o) : null,
    audit,
  };
}

/** /admin/store/categories: every category (hidden ones too) with product counts. */
export async function getAdminStoreCategories(): Promise<AdminStoreCategory[]> {
  await requireAdmin();
  const db = getDb();
  const [cats, live, all] = await Promise.all([
    db.select().from(storeCategories).orderBy(asc(storeCategories.sort), asc(storeCategories.name)),
    db.select({ categoryId: storeProducts.categoryId, n: count() }).from(storeProducts).where(inCatalog).groupBy(storeProducts.categoryId),
    db
      .select({ categoryId: storeProducts.categoryId, n: count() })
      .from(storeProducts)
      .where(isNull(storeProducts.archivedAt))
      .groupBy(storeProducts.categoryId),
  ]);
  const liveBy = new Map(live.map((r) => [r.categoryId, r.n]));
  const allBy = new Map(all.map((r) => [r.categoryId, r.n]));
  return cats.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    icon: c.emojiIcon,
    sort: c.sort,
    isActive: c.isActive,
    productCount: liveBy.get(c.id) ?? 0,
    totalProducts: allBy.get(c.id) ?? 0,
  }));
}

/** Start of the current IST month as a UTC instant. */
function istMonthStart(now = new Date()): { start: Date; label: string } {
  const [y, m] = todayIST(now).split("-") as [string, string];
  const start = new Date(`${y}-${m}-01T00:00:00+05:30`);
  const label = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(start);
  return { start, label };
}

/** /admin/store overview: open orders by status, low stock, month revenue, recent orders. */
export async function getAdminStoreOverview(): Promise<AdminStoreOverview> {
  await requireAdmin();
  const db = getDb();
  const { start, label } = istMonthStart();
  const live = and(isNull(storeProducts.archivedAt), eq(storeProducts.isActive, true));
  const [byStatus, [refund], low, [outRow], [activeRow], [online], [cod], [monthOrders], recent, settings] = await Promise.all([
    db
      .select({ status: storeOrders.status, n: count() })
      .from(storeOrders)
      .where(inArray(storeOrders.status, ["awaiting_payment", "placed", "packed", "out_for_delivery"]))
      .groupBy(storeOrders.status),
    db.select({ n: count() }).from(storeOrders).where(eq(storeOrders.paymentStatus, "refund_due")),
    db
      .select()
      .from(storeProducts)
      .where(and(live, lte(storeProducts.stock, storeProducts.lowStockAt)))
      .orderBy(asc(storeProducts.stock), asc(storeProducts.name))
      .limit(10),
    db.select({ n: count() }).from(storeProducts).where(and(live, eq(storeProducts.stock, 0))),
    db.select({ n: count() }).from(storeProducts).where(live),
    db
      .select({ n: sum(storeOrders.totalPaise) })
      .from(storeOrders)
      .where(and(gte(storeOrders.createdAt, start), eq(storeOrders.paymentMode, "online"), eq(storeOrders.paymentStatus, "paid"))),
    db
      .select({ n: sum(storeOrders.totalPaise) })
      .from(storeOrders)
      .where(and(gte(storeOrders.createdAt, start), eq(storeOrders.paymentMode, "cod"), eq(storeOrders.status, "delivered"))),
    db
      .select({ n: count() })
      .from(storeOrders)
      .where(and(gte(storeOrders.createdAt, start), ne(storeOrders.status, "cancelled"), ne(storeOrders.status, "awaiting_payment"))),
    db.select().from(storeOrders).where(ne(storeOrders.status, "awaiting_payment")).orderBy(desc(storeOrders.createdAt)).limit(8),
    loadSettings(),
  ]);
  const names = await categoryNames();
  const openByStatus = { awaiting_payment: 0, placed: 0, packed: 0, out_for_delivery: 0 };
  for (const r of byStatus) {
    if (r.status in openByStatus) openByStatus[r.status as keyof typeof openByStatus] = r.n;
  }
  const onlinePaise = Number(online?.n ?? 0);
  const codPaise = Number(cod?.n ?? 0);
  return {
    openByStatus,
    refundDue: refund?.n ?? 0,
    lowStock: low.map((p) => toAdminRow(p, names.get(p.categoryId)?.name ?? p.categoryId)),
    outOfStockCount: outRow?.n ?? 0,
    activeProducts: activeRow?.n ?? 0,
    month: { label, onlinePaise, codPaise, totalPaise: onlinePaise + codPaise, orders: monthOrders?.n ?? 0 },
    recentOrders: await toAdminOrderRows(recent),
    settings: { isOpen: settings.isOpen, codEnabled: settings.codEnabled },
  };
}

/** Admin nav badge: store orders waiting to be packed. */
export async function getStoreNewOrdersCount(): Promise<number> {
  await requireAdmin();
  const [row] = await getDb().select({ n: count() }).from(storeOrders).where(eq(storeOrders.status, "placed"));
  return row?.n ?? 0;
}
