"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { LOCATION_COOKIE } from "@/lib/location";
import { and, eq, inArray, isNull, or, gte } from "drizzle-orm";
import { getDb } from "@/db";
import {
  consumers,
  customers,
  ledgerEntries,
  products,
  shopOrderItems,
  shopOrders,
  subscriptions,
  vendors,
} from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import { findNearestLocality } from "@/core/geo";
import { getLocalities } from "@/features/platform/queries";
import { cartTotals, canTransition, formatOrderNumber, type ShopOrderStatus } from "@/core/shop";
import { depositKey } from "@/core/ledger";
import { addDaysIST, todayIST, weekdayIST } from "@/core/time";
import { isLate } from "@/core/cutoff";
import { applyHouseholdDayChange } from "@/features/day-changes/household";
import { addressLine, deliveryCheck, ensureCustomer, loadProfile } from "./household";
import {
  cancelOrderSchema,
  endSubscriptionSchema,
  myDayChangeSchema,
  placeOrderSchema,
  saveLocationSchema,
  saveProfileSchema,
  subscribeSchema,
} from "./schemas";


function fail(error: string) {
  return { ok: false as const, error };
}

export async function saveProfile(input: unknown) {
  const parsed = saveProfileSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid details");

  const user = await requireUser();
  const db = getDb();
  const data = parsed.data;
  const values = {
    name: data.name,
    phone: data.phone,
    email: user.primaryEmail ?? null,
    society: data.society,
    tower: data.tower,
    floor: data.floor,
    flat: data.flat,
    landmark: data.landmark || null,
    area: data.area,
    city: data.city,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    updatedAt: new Date(),
  };

  await db
    .insert(consumers)
    .values({ userId: user.id, ...values })
    .onConflictDoUpdate({ target: consumers.userId, set: values });

  revalidatePath("/app", "layout");
  return { ok: true as const };
}

/** Saves a GPS point. Fills area/city from the nearest known locality for new households. */
export async function saveLocation(input: unknown) {
  const parsed = saveLocationSchema.safeParse(input);
  if (!parsed.success) return fail("Could not read your location");

  const user = await requireUser();
  const db = getDb();
  const { latitude, longitude } = parsed.data;
  const near = findNearestLocality(latitude, longitude, await getLocalities());
  const existing = await loadProfile(user.id);

  if (existing) {
    await db
      .update(consumers)
      .set({ latitude, longitude, updatedAt: new Date() })
      .where(eq(consumers.userId, user.id));
  }

  // Remember the fix for households that have not saved an address yet.
  (await cookies()).set(LOCATION_COOKIE, `${latitude.toFixed(5)},${longitude.toFixed(5)}`, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/app",
    maxAge: 60 * 60 * 24 * 30,
  });

  revalidatePath("/app", "layout");
  return {
    ok: true as const,
    needsAddress: !existing,
    area: near && near.distanceKm <= 25 ? near.locality.name : "",
    city: near && near.distanceKm <= 25 ? near.locality.city : "",
  };
}

export async function placeOrder(input: unknown) {
  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid order");

  const user = await requireUser();
  const profile = await loadProfile(user.id);
  if (!profile) return fail("Add your delivery address before placing an order");

  const db = getDb();
  const data = parsed.data;

  // A repeated tap returns the order that already exists.
  const [already] = await db
    .select({ id: shopOrders.id, userId: shopOrders.userId })
    .from(shopOrders)
    .where(eq(shopOrders.clientKey, data.clientKey))
    .limit(1);
  if (already) {
    return already.userId === user.id ? { ok: true as const, orderId: already.id } : fail("Please try again");
  }

  const [vendor] = await db
    .select()
    .from(vendors)
    .where(and(eq(vendors.slug, data.vendorSlug), eq(vendors.status, "active")))
    .limit(1);
  if (!vendor) return fail("This store is not available right now");
  if (!vendor.acceptingOrders) return fail(`${vendor.name} is not taking orders right now`);
  const outOfArea = await deliveryCheck(vendor, profile);
  if (outOfArea) return fail(outOfArea);

  // Prices always come from the database, never from the cart.
  const ids = data.items.map((i) => i.productId);
  const rows = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.vendorId, vendor.id),
        inArray(products.id, ids),
        isNull(products.archivedAt),
        eq(products.isAvailable, true),
        eq(products.allowOneTime, true)
      )
    );
  const byId = new Map(rows.map((p) => [p.id, p]));

  const qtyById = new Map<string, number>();
  for (const item of data.items) {
    qtyById.set(item.productId, Math.min(20, (qtyById.get(item.productId) ?? 0) + item.qty));
  }

  const lines: { product: (typeof rows)[number]; qty: number }[] = [];
  for (const [productId, qty] of qtyById) {
    const product = byId.get(productId);
    if (!product) return fail("Some items are no longer available. Refresh your cart.");
    lines.push({ product, qty });
  }

  const totals = cartTotals(
    lines.map((l) => ({ unitPricePaise: l.product.pricePaise, qty: l.qty })),
    vendor.deliveryFeePaise
  );
  if (totals.subtotalPaise < vendor.minOrderPaise) {
    return fail("This store has a minimum order value. Add a few more items.");
  }

  const today = todayIST();
  const deliverOn = data.deliverOn === "today" ? today : addDaysIST(today, 1);
  const suffix = crypto.randomBytes(3).toString("hex").slice(0, 5);

  try {
    const orderId = await db.transaction(async (tx) => {
      const customerId = await ensureCustomer(tx, vendor.id, profile);
      const [order] = await tx
        .insert(shopOrders)
        .values({
          number: formatOrderNumber(today, suffix),
          clientKey: data.clientKey,
          vendorId: vendor.id,
          customerId,
          userId: user.id,
          // Online orders reach the store only after Razorpay confirms payment.
          status: data.paymentMode === "online" ? "awaiting_payment" : "placed",
          paymentMode: data.paymentMode,
          subtotalPaise: totals.subtotalPaise,
          deliveryFeePaise: totals.deliveryFeePaise,
          totalPaise: totals.totalPaise,
          deliverOn,
          slot: data.slot,
          address: addressLine(profile),
          notes: data.notes || null,
        })
        .returning({ id: shopOrders.id });

      await tx.insert(shopOrderItems).values(
        lines.map((l) => ({
          orderId: order!.id,
          vendorId: vendor.id,
          productId: l.product.id,
          name: l.product.name,
          unitPricePaise: l.product.pricePaise,
          qty: l.qty,
          lineTotalPaise: l.product.pricePaise * l.qty,
        }))
      );
      return order!.id;
    });

    revalidatePath("/app/orders");
    revalidatePath(`/merchant-panel/${vendor.slug}/orders`);
    return { ok: true as const, orderId };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "PHONE_LINKED_ELSEWHERE") {
      return fail("Your phone number is linked to another RUXs account at this store.");
    }
    return fail("Could not place your order. Please try again.");
  }
}

export async function cancelMyOrder(input: unknown) {
  const parsed = cancelOrderSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid order");

  const user = await requireUser();
  const db = getDb();
  const [order] = await db
    .select()
    .from(shopOrders)
    .where(and(eq(shopOrders.id, parsed.data.orderId), eq(shopOrders.userId, user.id)))
    .limit(1);
  if (!order) return fail("Order not found");
  if (!canTransition(order.status as ShopOrderStatus, "cancelled", "consumer")) {
    return fail("The store has already started on this order");
  }

  // Guard on status so a concurrent accept wins over a late cancel.
  const [updated] = await db
    .update(shopOrders)
    .set({
      status: "cancelled",
      cancelReason: "Cancelled by customer",
      ...(order.paymentStatus === "paid" ? { paymentStatus: "refund_due" } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(shopOrders.id, order.id), eq(shopOrders.status, order.status)))
    .returning({ id: shopOrders.id });
  if (!updated) return fail("The store has already started on this order");

  revalidatePath("/app/orders");
  revalidatePath(`/app/orders/${order.id}`);
  return { ok: true as const };
}

export async function subscribe(input: unknown) {
  const parsed = subscribeSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid plan");

  const user = await requireUser();
  const profile = await loadProfile(user.id);
  if (!profile) return fail("Add your delivery address before subscribing");

  const db = getDb();
  const data = parsed.data;
  const today = todayIST();
  if (data.startsOn <= today) return fail("Plans start from tomorrow at the earliest");
  if (data.startsOn > addDaysIST(today, 60)) return fail("Pick a start date within the next two months");

  const [row] = await db
    .select({ product: products, vendor: vendors })
    .from(products)
    .innerJoin(vendors, eq(products.vendorId, vendors.id))
    .where(
      and(
        eq(products.id, data.productId),
        eq(vendors.status, "active"),
        isNull(products.archivedAt),
        eq(products.isAvailable, true),
        eq(products.allowSubscription, true)
      )
    )
    .limit(1);
  if (!row) return fail("This plan is not available right now");
  const { product, vendor } = row;
  const outOfArea = await deliveryCheck(vendor, profile);
  if (outOfArea) return fail(outOfArea);

  try {
    const subscriptionId = await db.transaction(async (tx) => {
      const customerId = await ensureCustomer(tx, vendor.id, profile);

      const [existing] = await tx
        .select({ id: subscriptions.id })
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.customerId, customerId),
            eq(subscriptions.productId, product.id),
            or(isNull(subscriptions.endsOn), gte(subscriptions.endsOn, today))
          )
        )
        .limit(1);

      let id: string;
      if (existing) {
        await tx
          .update(subscriptions)
          .set({ qty: data.qty, days: data.days, endsOn: null })
          .where(eq(subscriptions.id, existing.id));
        id = existing.id;
      } else {
        const [created] = await tx
          .insert(subscriptions)
          .values({
            vendorId: vendor.id,
            customerId,
            productId: product.id,
            qty: data.qty,
            days: data.days,
            startsOn: data.startsOn,
          })
          .returning({ id: subscriptions.id });
        id = created!.id;
      }

      // Refundable deposit for returnables (cans, dabbas), charged once per asset.
      if (product.depositPaise > 0 && product.assetName) {
        await tx
          .insert(ledgerEntries)
          .values({
            vendorId: vendor.id,
            customerId,
            type: "deposit",
            amountPaise: product.depositPaise * data.qty,
            notes: `Refundable deposit for ${product.assetName}`,
            idempotencyKey: depositKey(customerId, product.assetName),
            createdBy: user.id,
          })
          .onConflictDoNothing();
      }
      return id;
    });

    revalidatePath("/app/plans");
    revalidatePath(`/merchant-panel/${vendor.slug}/subscriptions`);
    return { ok: true as const, subscriptionId };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "PHONE_LINKED_ELSEWHERE") {
      return fail("Your phone number is linked to another RUXs account at this store.");
    }
    return fail("Could not start your plan. Please try again.");
  }
}

async function findMySubscription(userId: string, subscriptionId: string) {
  const db = getDb();
  const [row] = await db
    .select({ sub: subscriptions, customerId: customers.id })
    .from(subscriptions)
    .innerJoin(customers, eq(subscriptions.customerId, customers.id))
    .where(and(eq(subscriptions.id, subscriptionId), eq(customers.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function endMySubscription(input: unknown) {
  const parsed = endSubscriptionSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid plan");

  const user = await requireUser();
  const mine = await findMySubscription(user.id, parsed.data.subscriptionId);
  if (!mine) return fail("Plan not found");

  // Today's count may already be locked, so the plan ends after today.
  const today = todayIST();
  const endsOn = mine.sub.startsOn > today ? addDaysIST(mine.sub.startsOn, -1) : today;
  const db = getDb();
  await db.update(subscriptions).set({ endsOn }).where(eq(subscriptions.id, mine.sub.id));

  revalidatePath("/app/plans");
  return { ok: true as const };
}

export async function setMyDay(input: unknown) {
  const parsed = myDayChangeSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid change");

  const user = await requireUser();
  const { subscriptionId, serviceDate, kind } = parsed.data;
  if (serviceDate < todayIST()) return fail("That day has already passed");

  const mine = await findMySubscription(user.id, subscriptionId);
  if (!mine) return fail("Plan not found");

  try {
    const result = await applyHouseholdDayChange({
      vendorId: mine.sub.vendorId,
      customerId: mine.customerId,
      subscriptionId,
      serviceDate,
      kind: kind === "skip" ? "skip" : "qty",
      qty: kind === "skip" ? 0 : mine.sub.qty,
    });
    if (result.ok) revalidatePath("/app/plans");
    if (result.ok) revalidatePath("/app");
    return result;
  } catch {
    return fail("Could not update that day. Please try again.");
  }
}

/**
 * "I'm off today": skips every one of my plans scheduled for today whose cutoff
 * has not passed. Stores see each skip at once on their Today page and the
 * kitchen count drops; skips after cutoff are left alone (they may be charged).
 */
export async function skipAllToday() {
  const user = await requireUser();
  const db = getDb();
  const today = todayIST();
  const weekday = weekdayIST(today);
  const now = new Date();

  const mine = await db
    .select({ sub: subscriptions, customerId: customers.id, cutoffAt: products.cutoffAt })
    .from(subscriptions)
    .innerJoin(customers, eq(subscriptions.customerId, customers.id))
    .innerJoin(products, eq(subscriptions.productId, products.id))
    .where(and(eq(customers.userId, user.id), or(isNull(subscriptions.endsOn), gte(subscriptions.endsOn, today))));

  let skipped = 0;
  let locked = 0;
  for (const row of mine) {
    if (!row.sub.days.includes(weekday) || row.sub.startsOn > today) continue;
    if (isLate(now, today, row.cutoffAt)) {
      locked++;
      continue;
    }
    const res = await applyHouseholdDayChange({
      vendorId: row.sub.vendorId,
      customerId: row.customerId,
      subscriptionId: row.sub.id,
      serviceDate: today,
      kind: "skip",
      qty: 0,
    });
    if (res.ok) skipped++;
  }

  revalidatePath("/app");
  revalidatePath("/app/plans");
  return { ok: true as const, skipped, locked };
}
