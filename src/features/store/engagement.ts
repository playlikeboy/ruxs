import "server-only";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { storeOrderItems, storeOrders, storeProductReviews, storeProducts, storeStockAlerts, storeWishlist } from "@/db/schema";
import type { StoreReviewStatus } from "@/core/store";
import type { StoreConn, StoreDb } from "./settings";

/**
 * Reviews, wishlist and back-in-stock subscriptions for households.
 * No auth here: callers pass the signed-in user's id.
 */

type Result<T extends object = object> = ({ ok: true } & T) | { ok: false; error: string };

/** Product id → my newest delivered order containing it. Only these products can be reviewed. */
export async function deliveredOrdersByProduct(db: StoreConn, userId: string, productIds?: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (productIds && productIds.length === 0) return out;
  const rows = await db
    .select({ productId: storeOrderItems.productId, orderId: storeOrders.id })
    .from(storeOrderItems)
    .innerJoin(storeOrders, eq(storeOrderItems.orderId, storeOrders.id))
    .where(and(eq(storeOrders.userId, userId), eq(storeOrders.status, "delivered"), productIds ? inArray(storeOrderItems.productId, productIds) : undefined))
    .orderBy(desc(storeOrders.deliveredAt));
  for (const r of rows) if (!out.has(r.productId)) out.set(r.productId, r.orderId);
  return out;
}

/**
 * Creates or edits my review of a product. Only buyers with a delivered order
 * containing it may review; every new or edited review waits for moderation.
 */
export async function submitStoreReviewCore(
  db: StoreDb,
  input: { userId: string; productId: string; rating: number; title: string; body: string; now?: Date }
): Promise<Result<{ reviewId: string; status: StoreReviewStatus }>> {
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) return { ok: false, error: "Pick a rating from 1 to 5" };
  const now = input.now ?? new Date();
  const orderId = (await deliveredOrdersByProduct(db, input.userId, [input.productId])).get(input.productId);
  if (!orderId) return { ok: false, error: "You can review a product once your order with it is delivered" };
  const values = { rating: input.rating, title: input.title.trim(), body: input.body.trim(), orderId, status: "pending", updatedAt: now };
  const [row] = await db
    .insert(storeProductReviews)
    .values({ ...values, productId: input.productId, userId: input.userId, createdAt: now })
    .onConflictDoUpdate({ target: [storeProductReviews.productId, storeProductReviews.userId], set: values })
    .returning({ id: storeProductReviews.id });
  return { ok: true, reviewId: row!.id, status: "pending" };
}

async function liveProduct(db: StoreConn, productId: string) {
  const [p] = await db
    .select({ id: storeProducts.id, stock: storeProducts.stock })
    .from(storeProducts)
    .where(and(eq(storeProducts.id, productId), eq(storeProducts.isActive, true), isNull(storeProducts.archivedAt)))
    .limit(1);
  return p ?? null;
}

/** Adds or removes a product from my wishlist. `on` omitted = toggle. */
export async function setWishlistCore(db: StoreDb, input: { userId: string; productId: string; on?: boolean }): Promise<Result<{ wishlisted: boolean }>> {
  const mine = and(eq(storeWishlist.userId, input.userId), eq(storeWishlist.productId, input.productId));
  let on = input.on;
  if (on === undefined) {
    const [existing] = await db.select({ productId: storeWishlist.productId }).from(storeWishlist).where(mine).limit(1);
    on = !existing;
  }
  if (!on) {
    await db.delete(storeWishlist).where(mine);
    return { ok: true, wishlisted: false };
  }
  if (!(await liveProduct(db, input.productId))) return { ok: false, error: "This product is no longer available" };
  await db.insert(storeWishlist).values({ userId: input.userId, productId: input.productId }).onConflictDoNothing();
  return { ok: true, wishlisted: true };
}

/** Subscribes me to (or removes me from) one email when a sold-out product is back. */
export async function setStockAlertCore(
  db: StoreDb,
  input: { userId: string; productId: string; email: string | null; on: boolean }
): Promise<Result<{ subscribed: boolean }>> {
  const mine = and(eq(storeStockAlerts.userId, input.userId), eq(storeStockAlerts.productId, input.productId));
  if (!input.on) {
    await db.delete(storeStockAlerts).where(mine);
    return { ok: true, subscribed: false };
  }
  const product = await liveProduct(db, input.productId);
  if (!product) return { ok: false, error: "This product is no longer available" };
  if (product.stock > 0) return { ok: false, error: "This product is in stock. You can add it to your bag now." };
  const email = input.email?.trim();
  if (!email) return { ok: false, error: "Add an email to your account so we can tell you when it is back" };
  // Re-subscribing after an earlier alert was sent arms it again.
  await db
    .insert(storeStockAlerts)
    .values({ userId: input.userId, productId: input.productId, email })
    .onConflictDoUpdate({ target: [storeStockAlerts.userId, storeStockAlerts.productId], set: { email, notifiedAt: null, createdAt: new Date() } });
  return { ok: true, subscribed: true };
}
