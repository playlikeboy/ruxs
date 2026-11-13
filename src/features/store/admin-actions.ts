"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  storeCollectionProducts,
  storeCollections,
  storeCoupons,
  storeFulfilmentPartners,
  storeOrders,
  storeProductReviews,
  storeProducts,
  storeShippingZones,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { storeSlug, type StoreReturnStatus, type StoreReviewStatus } from "@/core/store";
import { getAdminStoreOrdersExport, getAdminStoreProductsExport } from "./admin-queries";
import { writeStoreAudit } from "./audit";
import { bulkUpdateStockCore, importStoreProductsCore } from "./catalog-import";
import { forwardStoreOrderCore, sendPartnerOrderEmail, suggestPartners } from "./fulfilment";
import { moveStoreReturn, refundStoreReturn as refundStoreReturnCore } from "./returns";
import {
  bulkForwardStoreOrdersSchema,
  bulkStockSchema,
  forwardStoreOrderSchema,
  importStoreProductsSchema,
  moderateStoreReviewSchema,
  refundStoreReturnSchema,
  storeCollectionIdSchema,
  storeCollectionSchema,
  storeCouponIdSchema,
  storeCouponSchema,
  storeExportOrdersSchema,
  storeOrderIdSchema,
  storePartnerIdSchema,
  storePartnerSchema,
  storeShippingZoneSchema,
  storeZoneIdSchema,
  updateStoreOrderFulfilmentSchema,
  updateStoreReturnSchema,
} from "./schemas";
import type { AdminPartnerSuggestion, StoreActionResult, StoreBulkStockResult, StoreCsvExport, StoreImportResult } from "./types";

/**
 * Seller-portal actions added in RUXs Store v2. Every action is admin only and
 * writes to the insert-only store_audit_log. Fulfilment partners are internal:
 * none of these results may be rendered on a household page.
 */

const SHOP = "/app/kids/shop";
const ADMIN = "/seller-portal"; // the store back office lives here, not under /admin

function fail(error: string) {
  return { ok: false as const, error };
}

function firstIssue(err: { issues: { message: string }[] }, fallback = "Check the details and try again") {
  return err.issues[0]?.message ?? fallback;
}

function pgCode(err: unknown): string | undefined {
  const e = err as { code?: string; cause?: { code?: string } } | null;
  return e?.code ?? e?.cause?.code;
}

function revalidateOrder(orderId: string) {
  revalidatePath(`${ADMIN}/orders`);
  revalidatePath(`${ADMIN}/orders/${orderId}`);
  revalidatePath(`${ADMIN}/partners`);
  revalidatePath(ADMIN);
}

// ─── Shipping zones ──────────────────────────────────────────────────

/** Creates (no id) or updates a shipping zone. */
export async function saveStoreShippingZone(input: unknown): Promise<StoreActionResult<{ id: string }>> {
  const parsed = storeShippingZoneSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { user } = await requireAdmin();
  const db = getDb();
  const { id, ...data } = parsed.data;
  const now = new Date();
  let zoneId = id;
  if (id) {
    const [row] = await db
      .update(storeShippingZones)
      .set({ ...data, updatedAt: now })
      .where(eq(storeShippingZones.id, id))
      .returning({ id: storeShippingZones.id });
    if (!row) return fail("Shipping zone not found");
  } else {
    const [row] = await db
      .insert(storeShippingZones)
      .values({ ...data, createdAt: now, updatedAt: now })
      .returning({ id: storeShippingZones.id });
    zoneId = row!.id;
  }
  await writeStoreAudit(db, { actorUserId: user.id, action: id ? "zone.update" : "zone.create", entity: "zone", entityId: zoneId, data: { ...data } });
  revalidatePath(`${ADMIN}/shipping`);
  revalidatePath(SHOP, "layout");
  return { ok: true, id: zoneId! };
}

/** Removes a zone. One that already priced an order is switched off instead (orders keep pointing at it). */
export async function deleteStoreShippingZone(input: unknown): Promise<StoreActionResult<{ deactivated: boolean }>> {
  const parsed = storeZoneIdSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid shipping zone");
  const { user } = await requireAdmin();
  const db = getDb();
  const zoneId = parsed.data.zoneId;
  const [used] = await db.select({ id: storeOrders.id }).from(storeOrders).where(eq(storeOrders.zoneId, zoneId)).limit(1);
  let deactivated = false;
  if (used) {
    const [row] = await db.update(storeShippingZones).set({ isActive: false, updatedAt: new Date() }).where(eq(storeShippingZones.id, zoneId)).returning({ id: storeShippingZones.id });
    if (!row) return fail("Shipping zone not found");
    deactivated = true;
  } else {
    try {
      const [row] = await db.delete(storeShippingZones).where(eq(storeShippingZones.id, zoneId)).returning({ id: storeShippingZones.id });
      if (!row) return fail("Shipping zone not found");
    } catch (err) {
      // An order took this zone between the check and the delete.
      if (pgCode(err) !== "23503") throw err;
      await db.update(storeShippingZones).set({ isActive: false, updatedAt: new Date() }).where(eq(storeShippingZones.id, zoneId));
      deactivated = true;
    }
  }
  await writeStoreAudit(db, { actorUserId: user.id, action: deactivated ? "zone.deactivate" : "zone.delete", entity: "zone", entityId: zoneId });
  revalidatePath(`${ADMIN}/shipping`);
  revalidatePath(SHOP, "layout");
  return { ok: true, deactivated };
}

// ─── Fulfilment partners (INTERNAL) ──────────────────────────────────

/** Creates (no id) or updates a fulfilment partner. */
export async function saveStorePartner(input: unknown): Promise<StoreActionResult<{ id: string }>> {
  const parsed = storePartnerSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { user } = await requireAdmin();
  const db = getDb();
  const { id, ...data } = parsed.data;
  const now = new Date();
  let partnerId = id;
  if (id) {
    const [row] = await db
      .update(storeFulfilmentPartners)
      .set({ ...data, updatedAt: now })
      .where(eq(storeFulfilmentPartners.id, id))
      .returning({ id: storeFulfilmentPartners.id });
    if (!row) return fail("Partner not found");
  } else {
    const [row] = await db
      .insert(storeFulfilmentPartners)
      .values({ ...data, createdAt: now, updatedAt: now })
      .returning({ id: storeFulfilmentPartners.id });
    partnerId = row!.id;
  }
  await writeStoreAudit(db, {
    actorUserId: user.id,
    action: id ? "partner.update" : "partner.create",
    entity: "partner",
    entityId: partnerId,
    data: { name: data.name, email: data.email, isActive: data.isActive, coverageStates: data.coverageStates, coveragePinPrefixes: data.coveragePinPrefixes },
  });
  revalidatePath(`${ADMIN}/partners`);
  return { ok: true, id: partnerId! };
}

/** Removes a partner. One that has ever been sent an order is switched off instead. */
export async function deleteStorePartner(input: unknown): Promise<StoreActionResult<{ deactivated: boolean }>> {
  const parsed = storePartnerIdSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid partner");
  const { user } = await requireAdmin();
  const db = getDb();
  const partnerId = parsed.data.partnerId;
  const [used] = await db.select({ id: storeOrders.id }).from(storeOrders).where(eq(storeOrders.partnerId, partnerId)).limit(1);
  let deactivated = false;
  if (used) {
    const [row] = await db
      .update(storeFulfilmentPartners)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(storeFulfilmentPartners.id, partnerId))
      .returning({ id: storeFulfilmentPartners.id });
    if (!row) return fail("Partner not found");
    deactivated = true;
  } else {
    try {
      const [row] = await db.delete(storeFulfilmentPartners).where(eq(storeFulfilmentPartners.id, partnerId)).returning({ id: storeFulfilmentPartners.id });
      if (!row) return fail("Partner not found");
    } catch (err) {
      if (pgCode(err) !== "23503") throw err;
      await db.update(storeFulfilmentPartners).set({ isActive: false, updatedAt: new Date() }).where(eq(storeFulfilmentPartners.id, partnerId));
      deactivated = true;
    }
  }
  await writeStoreAudit(db, { actorUserId: user.id, action: deactivated ? "partner.deactivate" : "partner.delete", entity: "partner", entityId: partnerId });
  revalidatePath(`${ADMIN}/partners`);
  return { ok: true, deactivated };
}

/** Active partners that cover this order's PIN code / state, best match first. */
export async function suggestPartnerForOrder(input: unknown): Promise<StoreActionResult<{ suggestions: AdminPartnerSuggestion[]; best: AdminPartnerSuggestion | null }>> {
  const parsed = storeOrderIdSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid order");
  await requireAdmin();
  const db = getDb();
  const [order] = await db
    .select({ pincode: storeOrders.shipPincode, state: storeOrders.shipState })
    .from(storeOrders)
    .where(eq(storeOrders.id, parsed.data.orderId))
    .limit(1);
  if (!order) return fail("Order not found");
  const suggestions = await suggestPartners(db, order);
  return { ok: true, suggestions, best: suggestions[0] ?? null };
}

/**
 * Hands an order to a partner and emails them the order sheet (items, qty,
 * ship-to address, phone, COD amount to collect). Forwarding again to the same
 * partner resends the email; to another partner reassigns the order.
 * `emailed: false` means the order is marked forwarded but the email did not go.
 */
export async function forwardStoreOrder(
  input: unknown
): Promise<StoreActionResult<{ partnerId: string; partnerName: string; reassigned: boolean; emailed: boolean }>> {
  const parsed = forwardStoreOrderSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { user } = await requireAdmin();
  const db = getDb();
  const r = await forwardStoreOrderCore(db, { orderId: parsed.data.orderId, partnerId: parsed.data.partnerId, actorId: user.id });
  if (!r.ok) return fail(r.error);
  const sent = await sendPartnerOrderEmail(db, r.orderId, parsed.data.note);
  revalidateOrder(r.orderId);
  return { ok: true, partnerId: r.partnerId, partnerName: r.partnerName, reassigned: r.reassigned, emailed: sent.ok };
}

/**
 * Forwards up to 50 orders at once. With `partnerId` they all go to that
 * partner; without it each order goes to its own best-matching active partner.
 * Orders that can't be forwarded are listed in `skipped`.
 */
export async function bulkForwardStoreOrders(
  input: unknown
): Promise<StoreActionResult<{ forwarded: number; emailed: number; skipped: { orderId: string; orderNumber: string | null; error: string }[] }>> {
  const parsed = bulkForwardStoreOrdersSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { user } = await requireAdmin();
  const db = getDb();
  const orderIds = [...new Set(parsed.data.orderIds)];
  const orders = await db
    .select({ id: storeOrders.id, orderNumber: storeOrders.orderNumber, pincode: storeOrders.shipPincode, state: storeOrders.shipState })
    .from(storeOrders)
    .where(inArray(storeOrders.id, orderIds));
  const byId = new Map(orders.map((o) => [o.id, o]));
  let forwarded = 0;
  let emailed = 0;
  const skipped: { orderId: string; orderNumber: string | null; error: string }[] = [];
  for (const orderId of orderIds) {
    const order = byId.get(orderId);
    if (!order) {
      skipped.push({ orderId, orderNumber: null, error: "Order not found" });
      continue;
    }
    // Re-rank per order so the workload tie-break sees the orders just forwarded.
    const partnerId = parsed.data.partnerId ?? (await suggestPartners(db, order))[0]?.partnerId;
    if (!partnerId) {
      skipped.push({ orderId, orderNumber: order.orderNumber, error: "No active partner covers this PIN code" });
      continue;
    }
    const r = await forwardStoreOrderCore(db, { orderId, partnerId, actorId: user.id });
    if (!r.ok) {
      skipped.push({ orderId, orderNumber: order.orderNumber, error: r.error });
      continue;
    }
    forwarded++;
    if ((await sendPartnerOrderEmail(db, orderId)).ok) emailed++;
    revalidatePath(`${ADMIN}/orders/${orderId}`);
  }
  revalidatePath(`${ADMIN}/orders`);
  revalidatePath(`${ADMIN}/partners`);
  revalidatePath(ADMIN);
  return { ok: true, forwarded, emailed, skipped };
}

/**
 * Records what the partner reported back: their reference, a status note, and
 * the courier + tracking number. Only the tracking number is ever shown to the
 * household; the partner reference, note and courier name stay internal.
 */
export async function updateStoreOrderFulfilment(input: unknown): Promise<StoreActionResult> {
  const parsed = updateStoreOrderFulfilmentSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { user } = await requireAdmin();
  const db = getDb();
  const d = parsed.data;
  const [row] = await db
    .update(storeOrders)
    .set({
      partnerRef: d.partnerRef || null,
      partnerStatusNote: d.partnerStatusNote || null,
      courier: d.courier || null,
      trackingNumber: d.trackingNumber || null,
      updatedAt: new Date(),
    })
    .where(eq(storeOrders.id, d.orderId))
    .returning({ id: storeOrders.id });
  if (!row) return fail("Order not found");
  await writeStoreAudit(db, {
    actorUserId: user.id,
    action: "order.fulfilment",
    entity: "order",
    entityId: row.id,
    data: { partnerRef: d.partnerRef, partnerStatusNote: d.partnerStatusNote, courier: d.courier, trackingNumber: d.trackingNumber },
  });
  revalidateOrder(row.id);
  revalidatePath(`${SHOP}/orders/${row.id}`);
  return { ok: true };
}

// ─── Coupons ─────────────────────────────────────────────────────────

/** Creates (no id) or updates a coupon. Codes are unique whatever the letter case. */
export async function saveStoreCoupon(input: unknown): Promise<StoreActionResult<{ id: string; code: string }>> {
  const parsed = storeCouponSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { user } = await requireAdmin();
  const db = getDb();
  const { id, ...data } = parsed.data;
  // The cap only means something for percent coupons.
  const values = { ...data, maxDiscountPaise: data.kind === "percent" ? data.maxDiscountPaise : null };
  const [clash] = await db
    .select({ id: storeCoupons.id })
    .from(storeCoupons)
    .where(and(sql`upper(${storeCoupons.code}) = ${values.code}`, id ? ne(storeCoupons.id, id) : undefined))
    .limit(1);
  if (clash) return fail("Another coupon already uses this code");
  const now = new Date();
  let couponId = id;
  try {
    if (id) {
      const [row] = await db
        .update(storeCoupons)
        .set({ ...values, updatedAt: now })
        .where(eq(storeCoupons.id, id))
        .returning({ id: storeCoupons.id });
      if (!row) return fail("Coupon not found");
    } else {
      const [row] = await db
        .insert(storeCoupons)
        .values({ ...values, createdAt: now, updatedAt: now })
        .returning({ id: storeCoupons.id });
      couponId = row!.id;
    }
  } catch (err) {
    if (pgCode(err) === "23505") return fail("Another coupon already uses this code");
    console.error("[store] save coupon failed", err instanceof Error ? err.message : err);
    return fail("Could not save the coupon. Please try again.");
  }
  await writeStoreAudit(db, { actorUserId: user.id, action: id ? "coupon.update" : "coupon.create", entity: "coupon", entityId: couponId, data: { ...values } });
  revalidatePath(`${ADMIN}/coupons`);
  return { ok: true, id: couponId!, code: values.code };
}

/** Removes a coupon. One that an order has used is switched off instead (redemptions are kept). */
export async function deleteStoreCoupon(input: unknown): Promise<StoreActionResult<{ deactivated: boolean }>> {
  const parsed = storeCouponIdSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid coupon");
  const { user } = await requireAdmin();
  const db = getDb();
  const couponId = parsed.data.couponId;
  let deactivated = false;
  try {
    const [row] = await db.delete(storeCoupons).where(eq(storeCoupons.id, couponId)).returning({ id: storeCoupons.id });
    if (!row) return fail("Coupon not found");
  } catch (err) {
    // Referenced by an order or a redemption.
    if (pgCode(err) !== "23503") throw err;
    await db.update(storeCoupons).set({ isActive: false, updatedAt: new Date() }).where(eq(storeCoupons.id, couponId));
    deactivated = true;
  }
  await writeStoreAudit(db, { actorUserId: user.id, action: deactivated ? "coupon.deactivate" : "coupon.delete", entity: "coupon", entityId: couponId });
  revalidatePath(`${ADMIN}/coupons`);
  return { ok: true, deactivated };
}

// ─── Reviews ─────────────────────────────────────────────────────────

/** Publishes, hides or re-queues a review. Only published reviews count towards ratings. */
export async function moderateStoreReview(input: unknown): Promise<StoreActionResult<{ status: StoreReviewStatus }>> {
  const parsed = moderateStoreReviewSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid review");
  const { user } = await requireAdmin();
  const db = getDb();
  const [row] = await db
    .update(storeProductReviews)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(storeProductReviews.id, parsed.data.reviewId))
    .returning({ id: storeProductReviews.id, productId: storeProductReviews.productId });
  if (!row) return fail("Review not found");
  await writeStoreAudit(db, { actorUserId: user.id, action: `review.${parsed.data.status}`, entity: "review", entityId: row.id, data: { productId: row.productId } });
  revalidatePath(`${ADMIN}/reviews`);
  revalidatePath(SHOP, "layout");
  return { ok: true, status: parsed.data.status };
}

// ─── Returns ─────────────────────────────────────────────────────────

/**
 * Approves, declines or receives a return. `received` moves the order to
 * returned (payment becomes refund due) and restocks the units unless
 * `restock` is false. `note` is shown to the household.
 */
export async function updateStoreReturn(input: unknown): Promise<StoreActionResult<{ status: StoreReturnStatus; restocked: boolean }>> {
  const parsed = updateStoreReturnSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { user } = await requireAdmin();
  const d = parsed.data;
  if (d.to === "rejected" && !d.note) return fail("Add a short reason the household will see");
  const r = await moveStoreReturn(getDb(), { returnId: d.returnId, to: d.to, actorId: user.id, note: d.note, restock: d.restock });
  if (!r.ok) return r;
  revalidatePath(`${ADMIN}/returns`);
  revalidateOrder(r.orderId);
  revalidatePath(`${SHOP}/orders/${r.orderId}`);
  if (r.restocked) {
    revalidatePath(SHOP, "layout");
    revalidatePath(`${ADMIN}/products`);
  }
  return { ok: true, status: r.status, restocked: r.restocked };
}

/** Refunds a received return: through Razorpay for online orders, recorded by hand for COD. */
export async function refundStoreReturn(input: unknown): Promise<StoreActionResult<{ refundId: string | null; amountPaise: number }>> {
  const parsed = refundStoreReturnSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid return");
  const { user } = await requireAdmin();
  const r = await refundStoreReturnCore(getDb(), { returnId: parsed.data.returnId, actorId: user.id, note: parsed.data.note });
  if (!r.ok) return r;
  revalidatePath(`${ADMIN}/returns`);
  revalidateOrder(r.orderId);
  revalidatePath(`${SHOP}/orders/${r.orderId}`);
  return { ok: true, refundId: r.refundId, amountPaise: r.amountPaise };
}

// ─── Collections ─────────────────────────────────────────────────────

/**
 * Creates (no id) or updates a collection. With `productIds` the rail's
 * products are replaced, in the order given; archived products are dropped.
 */
export async function saveStoreCollection(input: unknown): Promise<StoreActionResult<{ id: string; slug: string }>> {
  const parsed = storeCollectionSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { user } = await requireAdmin();
  const db = getDb();
  const { id, slug: rawSlug, productIds, ...data } = parsed.data;
  const slug = rawSlug || storeSlug(data.title);
  if (!slug) return fail("Add a title with letters or numbers");
  const now = new Date();
  try {
    const collectionId = await db.transaction(async (tx) => {
      let cid = id;
      if (id) {
        const [row] = await tx
          .update(storeCollections)
          .set({ ...data, slug, updatedAt: now })
          .where(eq(storeCollections.id, id))
          .returning({ id: storeCollections.id });
        if (!row) return null;
      } else {
        const [row] = await tx
          .insert(storeCollections)
          .values({ ...data, slug, createdAt: now, updatedAt: now })
          .returning({ id: storeCollections.id });
        cid = row!.id;
      }
      if (productIds) {
        const ids = [...new Set(productIds)];
        const live = ids.length ? await tx.select({ id: storeProducts.id }).from(storeProducts).where(inArray(storeProducts.id, ids)) : [];
        const known = new Set(live.map((p) => p.id));
        await tx.delete(storeCollectionProducts).where(eq(storeCollectionProducts.collectionId, cid!));
        const rows = ids.filter((pid) => known.has(pid)).map((productId, sort) => ({ collectionId: cid!, productId, sort }));
        if (rows.length) await tx.insert(storeCollectionProducts).values(rows);
      }
      await writeStoreAudit(
        tx,
        { actorUserId: user.id, action: id ? "collection.update" : "collection.create", entity: "collection", entityId: cid, data: { ...data, slug, products: productIds?.length ?? null } },
        { strict: true }
      );
      return cid!;
    });
    if (!collectionId) return fail("Collection not found");
    revalidatePath(`${ADMIN}/collections`);
    revalidatePath(`${ADMIN}/collections/${collectionId}`);
    revalidatePath(SHOP, "layout");
    return { ok: true, id: collectionId, slug };
  } catch (err) {
    if (pgCode(err) === "23505") return fail("Another collection already uses this slug");
    console.error("[store] save collection failed", err instanceof Error ? err.message : err);
    return fail("Could not save the collection. Please try again.");
  }
}

/** Deletes a collection (the products themselves are untouched). */
export async function deleteStoreCollection(input: unknown): Promise<StoreActionResult> {
  const parsed = storeCollectionIdSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid collection");
  const { user } = await requireAdmin();
  const db = getDb();
  const [row] = await db
    .delete(storeCollections)
    .where(eq(storeCollections.id, parsed.data.collectionId))
    .returning({ id: storeCollections.id, slug: storeCollections.slug, title: storeCollections.title });
  if (!row) return fail("Collection not found");
  await writeStoreAudit(db, { actorUserId: user.id, action: "collection.delete", entity: "collection", entityId: row.id, data: { slug: row.slug, title: row.title } });
  revalidatePath(`${ADMIN}/collections`);
  revalidatePath(SHOP, "layout");
  return { ok: true };
}

// ─── Bulk catalog tools ──────────────────────────────────────────────

/**
 * Imports products from CSV text (same columns as the product export), matched
 * by SKU. Input: { csv, dryRun? }. Invalid rows are reported with their line
 * number and skipped; valid rows are written in one transaction.
 */
export async function importStoreProducts(input: unknown): Promise<StoreActionResult<{ result: StoreImportResult }>> {
  const parsed = importStoreProductsSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { user } = await requireAdmin();
  const result = await importStoreProductsCore(getDb(), { csv: parsed.data.csv, dryRun: parsed.data.dryRun, actorId: user.id });
  if (!result.dryRun) {
    revalidatePath(SHOP, "layout");
    revalidatePath(`${ADMIN}/products`);
    revalidatePath(ADMIN);
  }
  return { ok: true, result };
}

/**
 * Sets (mode "set") or changes (mode "add") the stock of many products by SKU.
 * Input: { mode?, rows?: [{ sku, qty }], csv?: "sku,stock" text, note? }.
 */
export async function bulkUpdateStoreStock(input: unknown): Promise<StoreActionResult<{ result: StoreBulkStockResult }>> {
  const parsed = bulkStockSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { user } = await requireAdmin();
  const d = parsed.data;
  const result = await bulkUpdateStockCore(getDb(), { mode: d.mode, rows: d.rows, csv: d.csv, note: d.note, actorId: user.id });
  if (result.updated > 0) {
    revalidatePath(SHOP, "layout");
    revalidatePath(`${ADMIN}/products`);
    revalidatePath(ADMIN);
  }
  return { ok: true, result };
}

/** Product catalog as CSV text for download (re-importable). */
export async function exportStoreProductsCsv(): Promise<StoreActionResult<{ export: StoreCsvExport }>> {
  const { user } = await requireAdmin();
  const data = await getAdminStoreProductsExport();
  await writeStoreAudit(getDb(), { actorUserId: user.id, action: "export.products", entity: "export", data: { rows: data.rowCount } });
  return { ok: true, export: data };
}

/** Orders as CSV text for download. Input: { status?, from?, to? } with IST dates (YYYY-MM-DD). Contains customer details: logged in the audit trail. */
export async function exportStoreOrdersCsv(input: unknown): Promise<StoreActionResult<{ export: StoreCsvExport }>> {
  const parsed = storeExportOrdersSchema.safeParse(input ?? {});
  if (!parsed.success) return fail("Pick valid dates");
  const { user } = await requireAdmin();
  const data = await getAdminStoreOrdersExport(parsed.data);
  await writeStoreAudit(getDb(), { actorUserId: user.id, action: "export.orders", entity: "export", data: { ...parsed.data, rows: data.rowCount } });
  return { ok: true, export: data };
}
