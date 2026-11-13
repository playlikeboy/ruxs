import "server-only";
import { and, asc, count, desc, eq, gte, inArray, isNotNull, isNull, lt, lte, ne, sql, sum, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import {
  consumers,
  storeAuditLog,
  storeCategories,
  storeCollectionProducts,
  storeCollections,
  storeCouponRedemptions,
  storeCoupons,
  storeFulfilmentPartners,
  storeOrderItems,
  storeOrders,
  storeProductReviews,
  storeProducts,
  storeReturnRequests,
  storeShippingZones,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { calculatePagination } from "@/core/pagination";
import { addDaysIST, todayIST } from "@/core/time";
import {
  INDIAN_STATES,
  STORE_ORDER_STATUSES,
  STORE_RETURN_STATUSES,
  STORE_REVIEW_STATUSES,
  type StoreCouponKind,
  type StoreOrderStatus,
  type StorePaymentMode,
  type StoreReturnStatus,
  type StoreReviewStatus,
} from "@/core/store";
import { paiseToRupeesText, PRODUCT_CSV_HEADERS, toCsv } from "./csv";
import { loadPartnersWithWorkload, suggestPartners } from "./fulfilment";
import { toAdminProductRow, toAdminReturn } from "./mappers";
import { loadStoreSettings } from "./settings";
import type {
  AdminAuditList,
  AdminCouponState,
  AdminFulfilmentPartner,
  AdminPartnerSuggestion,
  AdminShippingZonesPage,
  AdminStoreAnalytics,
  AdminStoreCollection,
  AdminStoreCollectionDetail,
  AdminStoreCoupon,
  AdminStoreOrderFilter,
  AdminStoreReturnList,
  AdminStoreReviewList,
  StoreCsvExport,
} from "./types";

/**
 * Seller-portal reads added in RUXs Store v2: shipping zones, fulfilment
 * partners, coupons, reviews, returns, collections, audit log, analytics and
 * CSV exports. Every export is admin only. Partner data never leaves this file
 * for a household page.
 */

const BOOKED: StoreOrderStatus[] = ["placed", "packed", "out_for_delivery", "delivered"];

// ─── Shipping zones ──────────────────────────────────────────────────

/** /admin/store/shipping: every zone (off ones too) plus the store-wide defaults. */
export async function getAdminShippingZones(): Promise<AdminShippingZonesPage> {
  await requireAdmin();
  const db = getDb();
  const [rows, settings] = await Promise.all([
    db.select().from(storeShippingZones).orderBy(asc(storeShippingZones.sort), asc(storeShippingZones.name)),
    loadStoreSettings(db),
  ]);
  return {
    zones: rows.map((z) => ({
      id: z.id,
      name: z.name,
      pinPrefixes: z.pinPrefixes,
      states: z.states,
      feePaise: z.feePaise,
      freeAbovePaise: z.freeAbovePaise,
      etaMinDays: z.etaMinDays,
      etaMaxDays: z.etaMaxDays,
      codAllowed: z.codAllowed,
      isActive: z.isActive,
      sort: z.sort,
      updatedAt: z.updatedAt,
    })),
    defaults: {
      feePaise: settings.deliveryFeePaise,
      freeAbovePaise: settings.freeDeliveryAbovePaise,
      etaMinDays: settings.defaultEtaMinDays,
      etaMaxDays: settings.defaultEtaMaxDays,
    },
    states: INDIAN_STATES,
  };
}

// ─── Fulfilment partners (INTERNAL) ──────────────────────────────────

/** /admin/store/partners: every partner with its current workload. */
export async function getAdminFulfilmentPartners(): Promise<AdminFulfilmentPartner[]> {
  await requireAdmin();
  return loadPartnersWithWorkload(getDb());
}

export async function getAdminFulfilmentPartner(partnerId: string): Promise<AdminFulfilmentPartner | null> {
  await requireAdmin();
  return (await loadPartnersWithWorkload(getDb())).find((p) => p.id === partnerId) ?? null;
}

/** Active partners that cover an order's destination, best match first. Empty when none covers it. */
export async function getPartnerSuggestionsForOrder(orderId: string): Promise<AdminPartnerSuggestion[]> {
  await requireAdmin();
  const db = getDb();
  const [o] = await db.select({ pincode: storeOrders.shipPincode, state: storeOrders.shipState }).from(storeOrders).where(eq(storeOrders.id, orderId)).limit(1);
  if (!o) return [];
  return suggestPartners(db, o);
}

// ─── Coupons ─────────────────────────────────────────────────────────

function couponState(c: { isActive: boolean; startsAt: Date | null; endsAt: Date | null; usageLimit: number | null }, uses: number, now: Date): AdminCouponState {
  if (!c.isActive) return "off";
  if (c.endsAt && now >= c.endsAt) return "expired";
  if (c.usageLimit != null && uses >= c.usageLimit) return "used_up";
  if (c.startsAt && now < c.startsAt) return "scheduled";
  return "live";
}

/** /admin/store/coupons: every coupon with how often it was used (cancelled orders not counted). */
export async function getAdminStoreCoupons(): Promise<AdminStoreCoupon[]> {
  await requireAdmin();
  const db = getDb();
  const [rows, usage] = await Promise.all([
    db.select().from(storeCoupons).orderBy(desc(storeCoupons.createdAt)),
    db
      .select({ couponId: storeCouponRedemptions.couponId, n: count(), discount: sum(storeCouponRedemptions.discountPaise) })
      .from(storeCouponRedemptions)
      .innerJoin(storeOrders, eq(storeCouponRedemptions.orderId, storeOrders.id))
      .where(ne(storeOrders.status, "cancelled"))
      .groupBy(storeCouponRedemptions.couponId),
  ]);
  const byId = new Map(usage.map((u) => [u.couponId, u]));
  const now = new Date();
  return rows.map((c) => {
    const uses = byId.get(c.id)?.n ?? 0;
    return {
      id: c.id,
      code: c.code,
      description: c.description,
      kind: c.kind as StoreCouponKind,
      value: c.value,
      minOrderPaise: c.minOrderPaise,
      maxDiscountPaise: c.maxDiscountPaise,
      usageLimit: c.usageLimit,
      perUserLimit: c.perUserLimit,
      startsAt: c.startsAt,
      endsAt: c.endsAt,
      isActive: c.isActive,
      state: couponState(c, uses, now),
      uses,
      discountGivenPaise: Number(byId.get(c.id)?.discount ?? 0),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  });
}

// ─── Reviews ─────────────────────────────────────────────────────────

/** /admin/store/reviews: the moderation queue. Default filter `pending`. */
export async function getAdminStoreReviews(opts: { status?: StoreReviewStatus | "all"; page?: number } = {}): Promise<AdminStoreReviewList> {
  await requireAdmin();
  const db = getDb();
  const status = opts.status ?? "pending";
  const where = status === "all" ? undefined : eq(storeProductReviews.status, status);
  const [[totalRow], byStatus] = await Promise.all([
    db.select({ n: count() }).from(storeProductReviews).where(where),
    db.select({ status: storeProductReviews.status, n: count() }).from(storeProductReviews).groupBy(storeProductReviews.status),
  ]);
  const total = totalRow?.n ?? 0;
  const pg = calculatePagination(total, { page: opts.page, defaultPageSize: 25, maxPageSize: 100 });
  const rows = await db
    .select({ r: storeProductReviews, productName: storeProducts.name, productSlug: storeProducts.slug, customerName: consumers.name, orderNumber: storeOrders.orderNumber })
    .from(storeProductReviews)
    .innerJoin(storeProducts, eq(storeProductReviews.productId, storeProducts.id))
    .leftJoin(consumers, eq(consumers.userId, storeProductReviews.userId))
    .leftJoin(storeOrders, eq(storeOrders.id, storeProductReviews.orderId))
    .where(where)
    .orderBy(desc(storeProductReviews.updatedAt))
    .limit(pg.pageSize)
    .offset(pg.offset);
  const counts = { all: 0, pending: 0, published: 0, hidden: 0 } as Record<StoreReviewStatus | "all", number>;
  for (const s of byStatus) {
    if ((STORE_REVIEW_STATUSES as readonly string[]).includes(s.status)) counts[s.status as StoreReviewStatus] = s.n;
    counts.all += s.n;
  }
  return {
    rows: rows.map(({ r, productName, productSlug, customerName, orderNumber }) => ({
      id: r.id,
      productId: r.productId,
      productName,
      productSlug,
      userId: r.userId,
      customerName,
      orderId: r.orderId,
      orderNumber,
      rating: r.rating,
      title: r.title,
      body: r.body,
      status: r.status as StoreReviewStatus,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
    total,
    page: pg.page,
    pageSize: pg.pageSize,
    totalPages: pg.totalPages,
    counts,
  };
}

// ─── Returns ─────────────────────────────────────────────────────────

/** /admin/store/returns. Default filter `requested`. */
export async function getAdminStoreReturns(opts: { status?: StoreReturnStatus | "all"; page?: number } = {}): Promise<AdminStoreReturnList> {
  await requireAdmin();
  const db = getDb();
  const status = opts.status ?? "requested";
  const where = status === "all" ? undefined : eq(storeReturnRequests.status, status);
  const [[totalRow], byStatus] = await Promise.all([
    db.select({ n: count() }).from(storeReturnRequests).where(where),
    db.select({ status: storeReturnRequests.status, n: count() }).from(storeReturnRequests).groupBy(storeReturnRequests.status),
  ]);
  const total = totalRow?.n ?? 0;
  const pg = calculatePagination(total, { page: opts.page, defaultPageSize: 25, maxPageSize: 100 });
  const rows = await db
    .select({ r: storeReturnRequests, o: storeOrders })
    .from(storeReturnRequests)
    .innerJoin(storeOrders, eq(storeReturnRequests.orderId, storeOrders.id))
    .where(where)
    .orderBy(desc(storeReturnRequests.createdAt))
    .limit(pg.pageSize)
    .offset(pg.offset);
  const counts = { all: 0, requested: 0, approved: 0, rejected: 0, received: 0, refunded: 0 } as Record<StoreReturnStatus | "all", number>;
  for (const s of byStatus) {
    if ((STORE_RETURN_STATUSES as readonly string[]).includes(s.status)) counts[s.status as StoreReturnStatus] = s.n;
    counts.all += s.n;
  }
  return { rows: rows.map(({ r, o }) => toAdminReturn(r, o)), total, page: pg.page, pageSize: pg.pageSize, totalPages: pg.totalPages, counts };
}

// ─── Collections ─────────────────────────────────────────────────────

function toAdminCollection(c: typeof storeCollections.$inferSelect, productCount: number): AdminStoreCollection {
  return { id: c.id, slug: c.slug, title: c.title, subtitle: c.subtitle, image: c.image, isActive: c.isActive, sort: c.sort, productCount, updatedAt: c.updatedAt };
}

/** /admin/store/collections: every collection with its product count. */
export async function getAdminStoreCollections(): Promise<AdminStoreCollection[]> {
  await requireAdmin();
  const db = getDb();
  const [cols, counts] = await Promise.all([
    db.select().from(storeCollections).orderBy(asc(storeCollections.sort), asc(storeCollections.title)),
    db.select({ collectionId: storeCollectionProducts.collectionId, n: count() }).from(storeCollectionProducts).groupBy(storeCollectionProducts.collectionId),
  ]);
  const byId = new Map(counts.map((c) => [c.collectionId, c.n]));
  return cols.map((c) => toAdminCollection(c, byId.get(c.id) ?? 0));
}

/** /admin/store/collections/[id]: one collection with its products in rail order. */
export async function getAdminStoreCollection(collectionId: string): Promise<AdminStoreCollectionDetail | null> {
  await requireAdmin();
  const db = getDb();
  const [c] = await db.select().from(storeCollections).where(eq(storeCollections.id, collectionId)).limit(1);
  if (!c) return null;
  const rows = await db
    .select({ p: storeProducts, categoryName: storeCategories.name })
    .from(storeCollectionProducts)
    .innerJoin(storeProducts, eq(storeCollectionProducts.productId, storeProducts.id))
    .innerJoin(storeCategories, eq(storeProducts.categoryId, storeCategories.id))
    .where(eq(storeCollectionProducts.collectionId, c.id))
    .orderBy(asc(storeCollectionProducts.sort), asc(storeProducts.name));
  return { ...toAdminCollection(c, rows.length), products: rows.map((r) => toAdminProductRow(r.p, r.categoryName)) };
}

// ─── Audit log ───────────────────────────────────────────────────────

/** /admin/store/audit: newest first. Filter by entity ("order", "product", …) and/or one entity id. */
export async function getAdminStoreAudit(opts: { entity?: string; entityId?: string; page?: number } = {}): Promise<AdminAuditList> {
  await requireAdmin();
  const db = getDb();
  const where = and(opts.entity ? eq(storeAuditLog.entity, opts.entity) : undefined, opts.entityId ? eq(storeAuditLog.entityId, opts.entityId) : undefined);
  const [totalRow] = await db.select({ n: count() }).from(storeAuditLog).where(where);
  const total = totalRow?.n ?? 0;
  const pg = calculatePagination(total, { page: opts.page, defaultPageSize: 50, maxPageSize: 200 });
  const rows = await db.select().from(storeAuditLog).where(where).orderBy(desc(storeAuditLog.createdAt)).limit(pg.pageSize).offset(pg.offset);
  return {
    rows: rows.map((a) => ({ id: a.id, actorUserId: a.actorUserId, action: a.action, entity: a.entity, entityId: a.entityId, data: a.data, createdAt: a.createdAt })),
    total,
    page: pg.page,
    pageSize: pg.pageSize,
    totalPages: pg.totalPages,
  };
}

// ─── Analytics ───────────────────────────────────────────────────────

/** /admin/store/analytics. "Last 30 days" = today and the 29 IST days before it. */
export async function getAdminStoreAnalytics(): Promise<AdminStoreAnalytics> {
  await requireAdmin();
  const db = getDb();
  const today = todayIST();
  const firstDay = addDaysIST(today, -29);
  const start = new Date(`${firstDay}T00:00:00+05:30`);
  const booked = inArray(storeOrders.status, BOOKED);
  const recent = and(gte(storeOrders.createdAt, start), booked);
  const day = sql<string>`to_char(${storeOrders.createdAt} at time zone 'Asia/Kolkata', 'YYYY-MM-DD')`;
  const liveProduct = and(isNull(storeProducts.archivedAt), eq(storeProducts.isActive, true));

  const [byDay, byStatus, top, low, split, coupons, partners, partnerRecent, [unassigned], returnRows, [discountRow]] = await Promise.all([
    db.select({ date: day, orders: count(), revenue: sum(storeOrders.totalPaise) }).from(storeOrders).where(recent).groupBy(day),
    db.select({ status: storeOrders.status, n: count() }).from(storeOrders).groupBy(storeOrders.status),
    db
      .select({
        productId: storeOrderItems.productId,
        name: sql<string>`max(${storeOrderItems.name})`,
        sku: sql<string | null>`max(${storeProducts.sku})`,
        units: sum(storeOrderItems.qty),
        revenue: sum(storeOrderItems.lineTotalPaise),
      })
      .from(storeOrderItems)
      .innerJoin(storeOrders, eq(storeOrderItems.orderId, storeOrders.id))
      .leftJoin(storeProducts, eq(storeOrderItems.productId, storeProducts.id))
      .where(recent)
      .groupBy(storeOrderItems.productId)
      .orderBy(desc(sum(storeOrderItems.qty)))
      .limit(10),
    db
      .select({ p: storeProducts, categoryName: storeCategories.name })
      .from(storeProducts)
      .innerJoin(storeCategories, eq(storeProducts.categoryId, storeCategories.id))
      .where(and(liveProduct, lte(storeProducts.stock, storeProducts.lowStockAt)))
      .orderBy(asc(storeProducts.stock), asc(storeProducts.name))
      .limit(20),
    db.select({ mode: storeOrders.paymentMode, orders: count(), revenue: sum(storeOrders.totalPaise) }).from(storeOrders).where(recent).groupBy(storeOrders.paymentMode),
    db
      .select({
        couponId: storeCouponRedemptions.couponId,
        code: sql<string>`max(${storeCoupons.code})`,
        uses: count(),
        discount: sum(storeCouponRedemptions.discountPaise),
        revenue: sum(storeOrders.totalPaise),
      })
      .from(storeCouponRedemptions)
      .innerJoin(storeOrders, eq(storeCouponRedemptions.orderId, storeOrders.id))
      .innerJoin(storeCoupons, eq(storeCouponRedemptions.couponId, storeCoupons.id))
      .where(recent)
      .groupBy(storeCouponRedemptions.couponId)
      .orderBy(desc(count()))
      .limit(20),
    loadPartnersWithWorkload(db),
    db
      .select({
        partnerId: storeOrders.partnerId,
        forwarded: count(),
        delivered: sql<number>`count(*) filter (where ${storeOrders.status} = 'delivered')::int`,
      })
      .from(storeOrders)
      .where(and(isNotNull(storeOrders.partnerId), gte(storeOrders.forwardedAt, start)))
      .groupBy(storeOrders.partnerId),
    db.select({ n: count() }).from(storeOrders).where(and(inArray(storeOrders.status, ["placed", "packed"]), isNull(storeOrders.partnerId))),
    db.select({ status: storeReturnRequests.status, n: count() }).from(storeReturnRequests).groupBy(storeReturnRequests.status),
    db.select({ n: sum(storeOrders.discountPaise) }).from(storeOrders).where(recent),
  ]);

  const dayMap = new Map(byDay.map((d) => [d.date, d]));
  const revenueByDay: AdminStoreAnalytics["revenueByDay"] = [];
  for (let i = 0; i < 30; i++) {
    const date = addDaysIST(firstDay, i);
    const d = dayMap.get(date);
    revenueByDay.push({ date, orders: d?.orders ?? 0, revenuePaise: Number(d?.revenue ?? 0) });
  }
  const orders = revenueByDay.reduce((n, d) => n + d.orders, 0);
  const revenuePaise = revenueByDay.reduce((n, d) => n + d.revenuePaise, 0);

  const ordersByStatus = Object.fromEntries(STORE_ORDER_STATUSES.map((s) => [s, 0])) as Record<StoreOrderStatus, number>;
  for (const s of byStatus) if (s.status in ordersByStatus) ordersByStatus[s.status as StoreOrderStatus] = s.n;

  const paymentSplit: AdminStoreAnalytics["paymentSplit"] = { online: { orders: 0, revenuePaise: 0 }, cod: { orders: 0, revenuePaise: 0 } };
  for (const s of split) {
    if (s.mode === "online" || s.mode === "cod") paymentSplit[s.mode as StorePaymentMode] = { orders: s.orders, revenuePaise: Number(s.revenue ?? 0) };
  }

  const recentByPartner = new Map(partnerRecent.map((p) => [p.partnerId, p]));
  const partnerWorkload: AdminStoreAnalytics["partnerWorkload"] = partners
    .filter((p) => p.isActive || p.openOrders > 0)
    .map((p) => ({
      partnerId: p.id,
      name: p.name,
      open: p.openOrders,
      forwarded30d: recentByPartner.get(p.id)?.forwarded ?? 0,
      delivered30d: recentByPartner.get(p.id)?.delivered ?? 0,
    }));
  partnerWorkload.push({ partnerId: null, name: "Not forwarded yet", open: unassigned?.n ?? 0, forwarded30d: 0, delivered30d: 0 });

  const returns = { requested: 0, approved: 0, received: 0, refunded: 0, rejected: 0 };
  for (const r of returnRows) if (r.status in returns) returns[r.status as keyof typeof returns] = r.n;

  return {
    revenueByDay,
    totals: { orders, revenuePaise, discountPaise: Number(discountRow?.n ?? 0), averageOrderPaise: orders > 0 ? Math.round(revenuePaise / orders) : 0 },
    ordersByStatus,
    topProducts: top.map((t) => ({ productId: t.productId, name: t.name, sku: t.sku, units: Number(t.units ?? 0), revenuePaise: Number(t.revenue ?? 0) })),
    lowStock: low.map((r) => toAdminProductRow(r.p, r.categoryName)),
    paymentSplit,
    couponUsage: coupons.map((c) => ({ couponId: c.couponId, code: c.code, uses: c.uses, discountPaise: Number(c.discount ?? 0), revenuePaise: Number(c.revenue ?? 0) })),
    partnerWorkload,
    returns,
  };
}

/** Seller-portal nav badges. */
export async function getStorePendingCounts(): Promise<{ toPack: number; toForward: number; returns: number; reviews: number; refundDue: number }> {
  await requireAdmin();
  const db = getDb();
  const [[toPack], [toForward], [returns], [reviews], [refundDue]] = await Promise.all([
    db.select({ n: count() }).from(storeOrders).where(eq(storeOrders.status, "placed")),
    db.select({ n: count() }).from(storeOrders).where(and(inArray(storeOrders.status, ["placed", "packed"]), isNull(storeOrders.partnerId))),
    db.select({ n: count() }).from(storeReturnRequests).where(inArray(storeReturnRequests.status, ["requested", "approved", "received"])),
    db.select({ n: count() }).from(storeProductReviews).where(eq(storeProductReviews.status, "pending")),
    db.select({ n: count() }).from(storeOrders).where(eq(storeOrders.paymentStatus, "refund_due")),
  ]);
  return { toPack: toPack?.n ?? 0, toForward: toForward?.n ?? 0, returns: returns?.n ?? 0, reviews: reviews?.n ?? 0, refundDue: refundDue?.n ?? 0 };
}

// ─── CSV exports ─────────────────────────────────────────────────────

const istStamp = (d: Date | null) =>
  d ? new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Kolkata", dateStyle: "short", timeStyle: "short" }).format(d) : "";

/**
 * Every non-archived product as CSV, in the same columns the product import
 * reads (export, edit in a spreadsheet, import again). Prices are rupees.
 */
export async function getAdminStoreProductsExport(): Promise<StoreCsvExport> {
  await requireAdmin();
  const rows = await getDb().select().from(storeProducts).where(isNull(storeProducts.archivedAt)).orderBy(asc(storeProducts.sku)).limit(5000);
  const csv = toCsv(
    PRODUCT_CSV_HEADERS,
    rows.map((p) => [
      p.sku,
      p.name,
      p.categoryId,
      paiseToRupeesText(p.pricePaise),
      p.mrpPaise != null ? paiseToRupeesText(p.mrpPaise) : "",
      p.stock,
      p.lowStockAt,
      p.gstBps,
      p.ageMin,
      p.ageMax ?? "",
      p.brand,
      p.tagline,
      p.description,
      p.skills.join(" | "),
      p.boxContents.join(" | "),
      p.safetyNotes,
      p.weightGrams ?? "",
      p.images.join(" | "),
      p.isFeatured,
      p.isActive,
      p.slug,
    ])
  );
  return { filename: `ruxs-store-products-${todayIST()}.csv`, csv, rowCount: rows.length };
}

export const ORDER_CSV_HEADERS = [
  "order_number",
  "placed_at_ist",
  "status",
  "payment_mode",
  "payment_status",
  "customer",
  "phone",
  "address",
  "city",
  "state",
  "pincode",
  "items",
  "units",
  "subtotal",
  "delivery_fee",
  "discount",
  "coupon",
  "total",
  "cod_to_collect",
  "partner",
  "partner_ref",
  "courier",
  "tracking_number",
  "delivered_at_ist",
] as const;

function exportStatusWhere(status: AdminStoreOrderFilter): SQL | undefined {
  switch (status) {
    case "all":
      return undefined;
    case "open":
      return inArray(storeOrders.status, ["placed", "packed", "out_for_delivery"]);
    case "refund_due":
      return eq(storeOrders.paymentStatus, "refund_due");
    case "to_forward":
      return and(inArray(storeOrders.status, ["placed", "packed"]), isNull(storeOrders.partnerId));
    default:
      return eq(storeOrders.status, status);
  }
}

/**
 * Orders as CSV (newest first, up to 5000). `from`/`to` are IST dates
 * (YYYY-MM-DD, inclusive) on the order's creation time. INTERNAL: includes the
 * fulfilment partner, so this file is for the seller portal only.
 */
export async function getAdminStoreOrdersExport(opts: { status?: AdminStoreOrderFilter; from?: string; to?: string } = {}): Promise<StoreCsvExport> {
  await requireAdmin();
  const db = getDb();
  const from = opts.from ? new Date(`${opts.from}T00:00:00+05:30`) : null;
  const toExclusive = opts.to ? new Date(`${addDaysIST(opts.to, 1)}T00:00:00+05:30`) : null;
  const where = and(
    exportStatusWhere(opts.status ?? "all"),
    from && !Number.isNaN(from.getTime()) ? gte(storeOrders.createdAt, from) : undefined,
    toExclusive && !Number.isNaN(toExclusive.getTime()) ? lt(storeOrders.createdAt, toExclusive) : undefined
  );
  const orders = await db
    .select({ o: storeOrders, partnerName: storeFulfilmentPartners.name })
    .from(storeOrders)
    .leftJoin(storeFulfilmentPartners, eq(storeFulfilmentPartners.id, storeOrders.partnerId))
    .where(where)
    .orderBy(desc(storeOrders.createdAt))
    .limit(5000);
  const ids = orders.map((r) => r.o.id);
  const itemsByOrder = new Map<string, { name: string; qty: number }[]>();
  for (let i = 0; i < ids.length; i += 1000) {
    const chunk = await db
      .select({ orderId: storeOrderItems.orderId, name: storeOrderItems.name, qty: storeOrderItems.qty })
      .from(storeOrderItems)
      .where(inArray(storeOrderItems.orderId, ids.slice(i, i + 1000)))
      .orderBy(asc(storeOrderItems.name));
    for (const it of chunk) {
      const list = itemsByOrder.get(it.orderId) ?? [];
      list.push(it);
      itemsByOrder.set(it.orderId, list);
    }
  }
  const csv = toCsv(
    ORDER_CSV_HEADERS,
    orders.map(({ o, partnerName }) => {
      const items = itemsByOrder.get(o.id) ?? [];
      return [
        o.orderNumber,
        istStamp(o.placedAt ?? o.createdAt),
        o.status,
        o.paymentMode,
        o.paymentStatus,
        o.customerName,
        o.phone,
        o.address,
        o.shipCity ?? "",
        o.shipState ?? "",
        o.shipPincode ?? "",
        items.map((i) => `${i.qty} x ${i.name}`).join(" | "),
        items.reduce((n, i) => n + i.qty, 0),
        paiseToRupeesText(o.subtotalPaise),
        paiseToRupeesText(o.deliveryFeePaise),
        paiseToRupeesText(o.discountPaise),
        o.couponCode ?? "",
        paiseToRupeesText(o.totalPaise),
        paiseToRupeesText(o.paymentMode === "cod" && o.paymentStatus === "unpaid" ? o.totalPaise : 0),
        partnerName ?? "",
        o.partnerRef ?? "",
        o.courier ?? "",
        o.trackingNumber ?? "",
        istStamp(o.deliveredAt),
      ];
    })
  );
  return { filename: `ruxs-store-orders-${todayIST()}.csv`, csv, rowCount: orders.length };
}
