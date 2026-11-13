import "server-only";
import { and, count, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { storeOrders, storeProducts, storeStockAlerts, storeStockMovements } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { calculatePagination } from "@/core/pagination";
import { STORE_STOCK_REASONS, type StoreStockReason } from "@/core/store";

/**
 * Seller-portal reads the first backend pass did not cover: the store-wide
 * stock log, back-in-stock demand and the buyers list. Admin only.
 */

export interface SellerStockMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  delta: number;
  stockAfter: number;
  reason: StoreStockReason;
  orderId: string | null;
  orderNumber: string | null;
  /** True when a person made the change; false for checkout, cancel and other automatic moves. */
  byAdmin: boolean;
  note: string | null;
  createdAt: Date;
}

export interface SellerStockLog {
  rows: SellerStockMovement[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  reason: StoreStockReason | "all";
}

export function parseStockReason(v: string | string[] | undefined): StoreStockReason | "all" {
  const s = Array.isArray(v) ? v[0] : v;
  return (STORE_STOCK_REASONS as readonly string[]).includes(s ?? "") ? (s as StoreStockReason) : "all";
}

/** /seller-portal/inventory: every stock change across the catalogue, newest first. */
export async function getSellerStockLog(opts: { reason?: StoreStockReason | "all"; page?: number } = {}): Promise<SellerStockLog> {
  await requireAdmin();
  const db = getDb();
  const reason = opts.reason ?? "all";
  const where = reason === "all" ? undefined : eq(storeStockMovements.reason, reason);
  const [totalRow] = await db.select({ n: count() }).from(storeStockMovements).where(where);
  const total = totalRow?.n ?? 0;
  const pg = calculatePagination(total, { page: opts.page, defaultPageSize: 40, maxPageSize: 100 });
  const rows = await db
    .select({ m: storeStockMovements, productName: storeProducts.name, sku: storeProducts.sku, orderNumber: storeOrders.orderNumber })
    .from(storeStockMovements)
    .innerJoin(storeProducts, eq(storeStockMovements.productId, storeProducts.id))
    .leftJoin(storeOrders, eq(storeStockMovements.orderId, storeOrders.id))
    .where(where)
    .orderBy(desc(storeStockMovements.createdAt))
    .limit(pg.pageSize)
    .offset(pg.offset);
  return {
    rows: rows.map(({ m, productName, sku, orderNumber }) => ({
      id: m.id,
      productId: m.productId,
      productName,
      sku,
      delta: m.delta,
      stockAfter: m.stockAfter,
      reason: m.reason as StoreStockReason,
      orderId: m.orderId,
      orderNumber,
      byAdmin: m.reason === "restock" || m.reason === "adjust",
      note: m.note,
      createdAt: m.createdAt,
    })),
    total,
    page: pg.page,
    pageSize: pg.pageSize,
    totalPages: pg.totalPages,
    reason,
  };
}

export interface SellerStockDemand {
  /** Households still waiting for a back-in-stock email. */
  waiting: number;
  /** Products with at least one household waiting, most wanted first, up to 20. */
  products: { productId: string; name: string; sku: string; stock: number; waiting: number }[];
}

/** Back-in-stock subscribers as counts only: no household is named here. */
export async function getSellerStockDemand(): Promise<SellerStockDemand> {
  await requireAdmin();
  const db = getDb();
  const waiting = count(storeStockAlerts.userId);
  const rows = await db
    .select({ productId: storeProducts.id, name: storeProducts.name, sku: storeProducts.sku, stock: storeProducts.stock, waiting })
    .from(storeStockAlerts)
    .innerJoin(storeProducts, eq(storeStockAlerts.productId, storeProducts.id))
    .where(isNull(storeStockAlerts.notifiedAt))
    .groupBy(storeProducts.id, storeProducts.name, storeProducts.sku, storeProducts.stock)
    .orderBy(desc(waiting))
    .limit(20);
  const [totalRow] = await db.select({ n: count() }).from(storeStockAlerts).where(isNull(storeStockAlerts.notifiedAt));
  return { waiting: totalRow?.n ?? 0, products: rows };
}

export interface SellerCustomerRow {
  userId: string;
  /** Name, phone and city as typed on the buyer's latest order. */
  name: string;
  phone: string;
  city: string | null;
  state: string | null;
  /** Booked orders: placed, packed, out for delivery or delivered. */
  orders: number;
  spentPaise: number;
  /** Every order, including cancelled, returned and unpaid ones. */
  allOrders: number;
  lastOrderAt: Date;
}

export interface SellerCustomerList {
  rows: SellerCustomerRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const BOOKED = ["placed", "packed", "out_for_delivery", "delivered"] as const;
const likePattern = (q: string) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

/**
 * /seller-portal/customers: one row per household that has ordered from the
 * store, biggest spender first. Reads only what the orders already hold.
 */
export async function getSellerCustomers(opts: { q?: string; page?: number } = {}): Promise<SellerCustomerList> {
  await requireAdmin();
  const db = getDb();
  const q = opts.q?.trim();
  const where = q ? or(ilike(storeOrders.customerName, likePattern(q)), ilike(storeOrders.phone, likePattern(q))) : undefined;
  const [totalRow] = await db.select({ n: sql<number>`count(distinct ${storeOrders.userId})`.mapWith(Number) }).from(storeOrders).where(where);
  const total = totalRow?.n ?? 0;
  const pg = calculatePagination(total, { page: opts.page, defaultPageSize: 30, maxPageSize: 100 });
  if (total === 0) return { rows: [], total, page: pg.page, pageSize: pg.pageSize, totalPages: pg.totalPages };

  const spent = sql<number>`coalesce(sum(${storeOrders.totalPaise}) filter (where ${inArray(storeOrders.status, [...BOOKED])}), 0)`.mapWith(Number);
  const lastOrderAt = sql<Date>`max(${storeOrders.createdAt})`.mapWith(storeOrders.createdAt);
  const latest = (col: typeof storeOrders.customerName | typeof storeOrders.phone | typeof storeOrders.shipCity | typeof storeOrders.shipState) =>
    sql<string | null>`(array_agg(${col} order by ${storeOrders.createdAt} desc))[1]`;
  // A search narrows which households match; their totals still count every order they placed.
  const matching = q ? inArray(storeOrders.userId, db.select({ id: storeOrders.userId }).from(storeOrders).where(where)) : undefined;
  const rows = await db
    .select({
      userId: storeOrders.userId,
      name: latest(storeOrders.customerName),
      phone: latest(storeOrders.phone),
      city: latest(storeOrders.shipCity),
      state: latest(storeOrders.shipState),
      orders: sql<number>`count(*) filter (where ${inArray(storeOrders.status, [...BOOKED])})`.mapWith(Number),
      spentPaise: spent,
      allOrders: count(),
      lastOrderAt,
    })
    .from(storeOrders)
    .where(and(matching))
    .groupBy(storeOrders.userId)
    .orderBy(desc(spent), desc(lastOrderAt))
    .limit(pg.pageSize)
    .offset(pg.offset);
  return {
    rows: rows.map((r) => ({ ...r, name: r.name ?? "", phone: r.phone ?? "" })),
    total,
    page: pg.page,
    pageSize: pg.pageSize,
    totalPages: pg.totalPages,
  };
}
