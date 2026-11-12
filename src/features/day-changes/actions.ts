"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { dayChanges, subscriptions, products } from "@/db/schema";
import { requireVendorAccess, requireCustomerByToken } from "@/lib/auth/session";
import { isLate } from "@/core/cutoff";
import { todayIST } from "@/core/time";
import { setDayChangeSchema, pauseDatesSchema } from "./schemas";
import { applyHouseholdDayChange, writeDayChange } from "./household";

export async function setDayChange(input: unknown) {
  const parsed = setDayChangeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { token, slug, subscriptionId, serviceDate, kind, qty } = parsed.data;
  const db = getDb();

  const today = todayIST();
  if (serviceDate < today) {
    return { ok: false, error: "Cannot modify meal schedule for past dates" };
  }

  if (token) {
    // Household authorized by private link token
    const auth = await requireCustomerByToken(token);
    try {
      const result = await applyHouseholdDayChange({
        vendorId: auth.vendorId,
        customerId: auth.customer.id,
        subscriptionId,
        serviceDate,
        kind,
        qty,
      });
      if (result.ok) revalidatePath(`/c/${token}`);
      return result;
    } catch (err: unknown) {
      console.error("[day-changes] household day change failed", { subscriptionId, serviceDate, err });
      return { ok: false, error: "Could not save the change. Please try again." };
    }
  } else if (slug) {
    // Vendor staff authorized
    const access = await requireVendorAccess(slug, ["owner", "staff"]);

    const [sub] = await db
      .select({ product: { name: products.name, cutoffAt: products.cutoffAt, lateRule: products.lateRule } })
      .from(subscriptions)
      .innerJoin(products, eq(subscriptions.productId, products.id))
      .where(
        and(
          eq(subscriptions.id, subscriptionId),
          eq(subscriptions.vendorId, access.vendorId)
        )
      )
      .limit(1);

    if (!sub) {
      return { ok: false, error: "Subscription not found" };
    }

    const now = new Date();
    const tapIsLate = isLate(now, serviceDate, sub.product.cutoffAt);

    try {
      // Staff may record a change after cutoff; the shared writer applies the late-skip fee atomically.
      await writeDayChange({
        vendorId: access.vendorId,
        subscriptionId,
        serviceDate,
        kind,
        qty,
        source: "vendor",
        isLate: tapIsLate,
        receivedAt: now,
        product: sub.product,
        actorId: access.user.id,
      });

      revalidatePath(`/merchant-panel/${slug}/today`);
      return { ok: true, isLate: tapIsLate };
    } catch (err: unknown) {
      console.error("[day-changes] vendor day change failed", { subscriptionId, serviceDate, err });
      return { ok: false, error: "Could not save the change. Please try again." };
    }
  } else {
    return { ok: false, error: "Unauthorized" };
  }
}

export async function pauseDates(input: unknown) {
  const parsed = pauseDatesSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { token, slug, subscriptionId, startDate, endDate } = parsed.data;
  const db = getDb();
  let vendorId: string;
  let targetSubIds: string[] = [];

  if (token) {
    const auth = await requireCustomerByToken(token);
    vendorId = auth.vendorId;

    if (subscriptionId) {
      const [owned] = await db
        .select({ id: subscriptions.id })
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.id, subscriptionId),
            eq(subscriptions.customerId, auth.customer.id),
            eq(subscriptions.vendorId, vendorId)
          )
        )
        .limit(1);

      if (!owned) {
        return { ok: false, error: "Subscription not found or unauthorized" };
      }
      targetSubIds = [owned.id];
    } else {
      const custSubs = await db
        .select({ id: subscriptions.id })
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.customerId, auth.customer.id),
            eq(subscriptions.vendorId, vendorId)
          )
        );
      targetSubIds = custSubs.map((s) => s.id);
    }
  } else if (slug && subscriptionId) {
    const access = await requireVendorAccess(slug, ["owner", "staff"]);
    vendorId = access.vendorId;

    const [vendorSub] = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.id, subscriptionId),
          eq(subscriptions.vendorId, vendorId)
        )
      )
      .limit(1);

    if (!vendorSub) {
      return { ok: false, error: "Subscription not found or unauthorized" };
    }
    targetSubIds = [vendorSub.id];
  } else {
    return { ok: false, error: "Unauthorized" };
  }

  // Validate date range and bounds
  const today = todayIST();
  if (startDate < today) {
    return { ok: false, error: "Cannot pause dates in the past" };
  }
  if (startDate > endDate) {
    return { ok: false, error: "Start date must be on or before end date" };
  }

  const startMs = new Date(startDate + "T00:00:00Z").getTime();
  const endMs = new Date(endDate + "T00:00:00Z").getTime();
  const diffDays = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24));
  if (diffDays > 60) {
    return { ok: false, error: "Maximum pause duration is 60 days" };
  }

  const now = new Date();

  // One multi-row upsert instead of a round trip per day per subscription.
  const rows: (typeof dayChanges.$inferInsert)[] = [];
  for (const cur = new Date(startMs); cur.getTime() <= endMs; cur.setUTCDate(cur.getUTCDate() + 1)) {
    const serviceDate = cur.toISOString().slice(0, 10);
    for (const subId of targetSubIds) {
      rows.push({
        vendorId,
        subscriptionId: subId,
        serviceDate,
        kind: "skip",
        qty: 0,
        source: "pause",
        receivedAt: now,
        isLate: false,
      });
    }
  }

  try {
    if (rows.length > 0) {
      await db
        .insert(dayChanges)
        .values(rows)
        .onConflictDoUpdate({
          target: [dayChanges.subscriptionId, dayChanges.serviceDate],
          set: {
            kind: "skip",
            qty: 0,
            source: "pause",
            receivedAt: now,
          },
        });
    }

    if (token) revalidatePath(`/c/${token}`);
    if (slug) revalidatePath(`/merchant-panel/${slug}/today`);
    return { ok: true };
  } catch (err: unknown) {
    console.error("[day-changes] pause failed", { startDate, endDate, err });
    return { ok: false, error: "Could not pause deliveries. Please try again." };
  }
}
