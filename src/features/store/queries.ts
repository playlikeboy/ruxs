import "server-only";
import { cache } from "react";
import { and, asc, count, desc, eq, gte, ilike, inArray, isNotNull, isNull, lte, ne, or, sql, sum, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { consumers, storeCategories, storeOrderItems, storeOrders, storePayments, storeProducts, storeStockMovements } from "@/db/schema";
import { requireAdmin, requireUser } from "@/lib/auth/session";
import { readGpsCookie } from "@/lib/location";
import { resolveCoordinates, type Coordinates } from "@/core/geo";
import { calculatePagination } from "@/core/pagination";
import { todayIST } from "@/core/time";
import {
  ageBandMatches,
  ageRangeLabel,
  canCustomerCancel,
  discountPercent,
  isCodAllowed,
  maxOrderQty,
  mergeBagLines,
  nextAdminStatuses,
  stockLabel,
  storeAgeBand,
  storeCartTotals,
  storeServiceability,
  STORE_MAX_LINES,
  STORE_PAYMENT_HOLD_MINUTES,
  STORE_STATUS_LABELS,
  STORE_TIMELINE,
  type StoreOrderStatus,
  type StorePaymentMode,
  type StorePaymentStatus,
  type StoreStockReason,
} from "@/core/store";
import { addressLine, loadProfile, type Profile } from "@/features/consumer/household";
import { getLocalities } from "@/features/platform/queries";
import { loadStoreSettings, toPublicSettings } from "./settle";
import type {
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
  AdminStoreProductRow,
  PublicStoreSettings,
  StoreAgeBandId,
  StoreBagQuote,
  StoreBagQuoteLine,
  StoreCategory,
  StoreCategoryPage,
  StoreDeliveryCheck,
  StoreHome,
  StoreOrderDetail,
  StoreOrderItemView,
  StoreOrderSummary,
  StoreProductCard,
  StoreProductDetail,
  StoreSettings,
  StoreSort,
} from "./types";

type ProductRow = typeof storeProducts.$inferSelect;
type OrderRow = typeof storeOrders.$inferSelect;

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

function toCard(p: ProductRow, categoryName: string): StoreProductCard {
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
  };
}

async function toCards(rows: ProductRow[]): Promise<StoreProductCard[]> {
  const names = await categoryNames();
  return rows.map((p) => toCard(p, names.get(p.categoryId)?.name ?? ""));
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

/** /app/kids/shop: featured strip, category chips, new arrivals and the (age-filtered) grid. */
export async function getStoreHome(opts: { age?: StoreAgeBandId | null } = {}): Promise<StoreHome> {
  const db = getDb();
  const age = opts.age ?? null;
  const [settings, categories, rows] = await Promise.all([
    getPublicStoreSettings(),
    activeCategories(),
    db.select().from(storeProducts).where(inCatalog).orderBy(desc(storeProducts.createdAt)).limit(500),
  ]);
  const activeCats = new Set(categories.map((c) => c.id));
  const visible = filterAge(rows.filter((p) => activeCats.has(p.categoryId)), age);
  const featured = sortProducts(visible.filter((p) => p.isFeatured), "featured").slice(0, 8);
  const newArrivals = sortProducts(visible, "new").slice(0, 8);
  const products = sortProducts(visible, "featured").slice(0, 60);
  const [f, n, p] = await Promise.all([toCards(featured), toCards(newArrivals), toCards(products)]);
  return { settings, categories, featured: f, newArrivals: n, products: p, age };
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
  const relatedRows = await db
    .select()
    .from(storeProducts)
    .where(and(inCatalog, eq(storeProducts.categoryId, p.categoryId), ne(storeProducts.id, p.id)))
    .orderBy(desc(storeProducts.isFeatured), desc(storeProducts.createdAt))
    .limit(8);
  return {
    ...toCard(p, c.name),
    description: p.description,
    images: p.images,
    boxContents: p.boxContents,
    safetyNotes: p.safetyNotes,
    weightGrams: p.weightGrams,
    gstBps: p.gstBps,
    category: { id: c.id, name: c.name, icon: c.emojiIcon },
    related: sortProducts(relatedRows, "featured")
      .slice(0, 4)
      .map((r) => toCard(r, c.name)),
  };
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
  if (!profile) {
    return { hasProfile: false, name: null, phone: null, address: null, serviceable: false, message: "Add your delivery address to check out" };
  }
  const reach = storeServiceability(await resolveStoreDeliveryPoint(profile), settings);
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
 * Server-side price and stock check for the localStorage bag. The server is
 * the source of truth: unknown/archived items are removed, quantities are
 * capped to stock. Pass `userId` to include the delivery-address check.
 */
export async function quoteStoreBag(
  items: { productId: string; qty: number }[],
  opts: { userId?: string | null } = {}
): Promise<StoreBagQuote> {
  const db = getDb();
  const lines = mergeBagLines(items).slice(0, STORE_MAX_LINES);
  const settings = await loadSettings();
  const ids = lines.map((l) => l.productId);
  const [rows, delivery] = await Promise.all([
    ids.length
      ? db
          .select({ p: storeProducts, catActive: storeCategories.isActive })
          .from(storeProducts)
          .innerJoin(storeCategories, eq(storeProducts.categoryId, storeCategories.id))
          .where(inArray(storeProducts.id, ids))
      : Promise.resolve([]),
    deliveryCheckFor(opts.userId ?? null, settings),
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

  const buyable = quoteLines.filter((l) => l.qty > 0);
  const totals = storeCartTotals(
    buyable.map((l) => ({ unitPricePaise: l.unitPricePaise, qty: l.qty })),
    settings
  );
  const paymentModes: StorePaymentMode[] = ["online"];
  if (isCodAllowed(totals.totalPaise, settings)) paymentModes.push("cod");

  const blockers: string[] = [];
  if (!settings.isOpen) blockers.push(settings.closedMessage || "The RUXs Store is closed right now");
  if (buyable.length === 0) blockers.push("Your bag is empty");
  else if (totals.subtotalPaise < settings.minOrderPaise) blockers.push("Add a few more items to reach the minimum order");
  if (delivery && !delivery.serviceable && delivery.message) blockers.push(delivery.message);

  return {
    lines: quoteLines,
    removedProductIds,
    subtotalPaise: totals.subtotalPaise,
    deliveryFeePaise: totals.deliveryFeePaise,
    totalPaise: totals.totalPaise,
    itemCount: totals.itemCount,
    freeDeliveryGapPaise: totals.freeDeliveryGapPaise,
    settings: toPublicSettings(settings),
    paymentModes,
    changed: removedProductIds.length > 0 || quoteLines.some((l) => l.issue !== null),
    blockers,
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
    });
    out.set(r.item.orderId, list);
  }
  return out;
}

function toSummary(o: OrderRow, items: StoreOrderItemView[]): StoreOrderSummary {
  const status = o.status as StoreOrderStatus;
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status,
    statusLabel: STORE_STATUS_LABELS[status] ?? o.status,
    paymentMode: o.paymentMode as StorePaymentMode,
    paymentStatus: o.paymentStatus as StorePaymentStatus,
    totalPaise: o.totalPaise,
    itemCount: items.reduce((n, i) => n + i.qty, 0),
    firstItemName: items[0]?.name ?? null,
    firstItemImage: items[0]?.image ?? null,
    createdAt: o.createdAt,
  };
}

function toDetail(o: OrderRow, items: StoreOrderItemView[], dispatchDays: number, now = new Date()): StoreOrderDetail {
  const status = o.status as StoreOrderStatus;
  const at: Record<string, Date | null> = { placed: o.placedAt, packed: o.packedAt, out_for_delivery: o.shippedAt, delivered: o.deliveredAt };
  const reached = STORE_TIMELINE.indexOf(status);
  const payBy = o.paymentMode === "online" && status === "awaiting_payment" ? new Date(o.createdAt.getTime() + STORE_PAYMENT_HOLD_MINUTES * 60_000) : null;
  return {
    ...toSummary(o, items),
    items,
    subtotalPaise: o.subtotalPaise,
    deliveryFeePaise: o.deliveryFeePaise,
    customerName: o.customerName,
    phone: o.phone,
    address: o.address,
    notes: o.notes,
    courier: o.courier,
    trackingNumber: o.trackingNumber,
    cancelReason: o.cancelReason,
    timeline: STORE_TIMELINE.map((s, i) => ({
      status: s,
      label: STORE_STATUS_LABELS[s],
      at: at[s] ?? null,
      done: (reached >= 0 && i <= reached) || at[s] != null,
    })),
    placedAt: o.placedAt,
    packedAt: o.packedAt,
    shippedAt: o.shippedAt,
    deliveredAt: o.deliveredAt,
    cancelledAt: o.cancelledAt,
    returnedAt: o.returnedAt,
    canCancel: canCustomerCancel(status),
    canPay: payBy != null && payBy > now,
    payBy,
    dispatchDays,
  };
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
  return rows.map((o) => toSummary(o, items.get(o.id) ?? []));
}

/** One of my store orders; null when it is not mine or does not exist. */
export async function getMyStoreOrder(orderId: string): Promise<StoreOrderDetail | null> {
  const user = await requireUser();
  const [o] = await getDb()
    .select()
    .from(storeOrders)
    .where(and(eq(storeOrders.id, orderId), eq(storeOrders.userId, user.id)))
    .limit(1);
  if (!o) return null;
  const [items, settings] = await Promise.all([itemsFor([o.id]), loadSettings()]);
  return toDetail(o, items.get(o.id) ?? [], settings.dispatchDays);
}

// ─── Admin ───────────────────────────────────────────────────────────

function toAdminRow(p: ProductRow, categoryName: string): AdminStoreProductRow {
  return {
    id: p.id,
    slug: p.slug,
    sku: p.sku,
    name: p.name,
    brand: p.brand,
    categoryId: p.categoryId,
    categoryName,
    pricePaise: p.pricePaise,
    mrpPaise: p.mrpPaise,
    stock: p.stock,
    lowStockAt: p.lowStockAt,
    stockKind: stockLabel(p.stock, p.lowStockAt).kind,
    image: p.images[0] ?? null,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    archivedAt: p.archivedAt,
    updatedAt: p.updatedAt,
  };
}

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
    default:
      return eq(storeOrders.status, filter);
  }
}

const ORDER_FILTERS: AdminStoreOrderFilter[] = [
  "open",
  "all",
  "refund_due",
  "awaiting_payment",
  "placed",
  "packed",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
];

async function toAdminOrderRows(rows: OrderRow[]): Promise<AdminStoreOrderRow[]> {
  const items = await itemsFor(rows.map((r) => r.id));
  return rows.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status as StoreOrderStatus,
    paymentMode: o.paymentMode as StorePaymentMode,
    paymentStatus: o.paymentStatus as StorePaymentStatus,
    totalPaise: o.totalPaise,
    itemCount: (items.get(o.id) ?? []).reduce((n, i) => n + i.qty, 0),
    customerName: o.customerName,
    phone: o.phone,
    createdAt: o.createdAt,
  }));
}

/** /admin/store/orders. Search matches order number, name and phone. Default filter `open`. */
export async function getAdminStoreOrders(
  opts: { status?: AdminStoreOrderFilter; q?: string; page?: number } = {}
): Promise<AdminStoreOrderList> {
  await requireAdmin();
  const db = getDb();
  const status = opts.status ?? "open";
  const q = opts.q?.trim();
  const search = q
    ? or(ilike(storeOrders.orderNumber, containsPattern(q)), ilike(storeOrders.customerName, containsPattern(q)), ilike(storeOrders.phone, containsPattern(q)))
    : undefined;
  const where = and(search, orderFilterWhere(status));
  const [[totalRow], countRows] = await Promise.all([
    db.select({ n: count() }).from(storeOrders).where(where),
    Promise.all(ORDER_FILTERS.map((f) => db.select({ n: count() }).from(storeOrders).where(and(search, orderFilterWhere(f))))),
  ]);
  const total = totalRow?.n ?? 0;
  const pg = calculatePagination(total, { page: opts.page, defaultPageSize: 25, maxPageSize: 100 });
  const rows = await db.select().from(storeOrders).where(where).orderBy(desc(storeOrders.createdAt)).limit(pg.pageSize).offset(pg.offset);
  const counts = Object.fromEntries(ORDER_FILTERS.map((f, i) => [f, countRows[i]?.[0]?.n ?? 0])) as Record<AdminStoreOrderFilter, number>;
  return { rows: await toAdminOrderRows(rows), total, page: pg.page, pageSize: pg.pageSize, totalPages: pg.totalPages, counts };
}

/** /admin/store/orders/[id]: full order with payments and the next allowed statuses. */
export async function getAdminStoreOrder(orderId: string): Promise<AdminStoreOrderDetail | null> {
  await requireAdmin();
  const db = getDb();
  const [row] = await db
    .select({ o: storeOrders, email: consumers.email })
    .from(storeOrders)
    .leftJoin(consumers, eq(consumers.userId, storeOrders.userId))
    .where(eq(storeOrders.id, orderId))
    .limit(1);
  if (!row) return null;
  const o = row.o;
  const [items, pays, settings] = await Promise.all([
    itemsFor([o.id]),
    db.select().from(storePayments).where(eq(storePayments.orderId, o.id)).orderBy(desc(storePayments.createdAt)),
    loadSettings(),
  ]);
  const status = o.status as StoreOrderStatus;
  const paymentStatus = o.paymentStatus as StorePaymentStatus;
  return {
    ...toDetail(o, items.get(o.id) ?? [], settings.dispatchDays),
    userId: o.userId,
    adminNote: o.adminNote,
    latitude: o.latitude,
    longitude: o.longitude,
    email: row.email,
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
