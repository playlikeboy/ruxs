"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { dayChanges, subscriptions, products, orders, ledgerEntries } from "@/db/schema";
import { requireVendorAccess, requireCustomerByToken } from "@/lib/auth/session";
import { isLate, lateCharge } from "@/core/cutoff";
import { lateFeeKey } from "@/core/ledger";
import { todayIST } from "@/core/time";
import { setDayChangeSchema, pauseDatesSchema } from "./schemas";
import { applyHouseholdDayChange } from "./household";

export async function setDayChange(input: unknown) {
  const parsed = setDayChangeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { token, slug, subscriptionId, serviceDate, kind, qty } = parsed.data;
  const db = getDb();
  let vendorId: string;
  let source: "link" | "vendor" = "link";

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
      const msg = err instanceof Error ? err.message : "Database error";
      return { ok: false, error: msg };
    }
  } else if (slug) {
    // Vendor staff authorized
    const access = await requireVendorAccess(slug, ["owner", "staff"]);
    vendorId = access.vendorId;
    source = "vendor";

    const [sub] = await db
      .select({ sub: subscriptions, product: products })
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
      await db
        .insert(dayChanges)
        .values({
          vendorId,
          subscriptionId,
          serviceDate,
          kind,
          qty,
          source,
          receivedAt: now,
          isLate: tapIsLate,
        })
        .onConflictDoUpdate({
          target: [dayChanges.subscriptionId, dayChanges.serviceDate],
          set: {
            kind,
            qty,
            source,
            receivedAt: now,
            isLate: tapIsLate,
          },
        });

      if (tapIsLate && kind === "skip") {
        const [existingOrder] = await db
          .select()
          .from(orders)
          .where(
            and(
              eq(orders.subscriptionId, subscriptionId),
              eq(orders.serviceDate, serviceDate)
            )
          )
          .limit(1);

        if (existingOrder && existingOrder.status === "confirmed") {
          await db
            .update(orders)
            .set({ status: "late_skip" })
            .where(eq(orders.id, existingOrder.id));

          const chargeResult = lateCharge(
            sub.product.lateRule as "free" | "half" | "full" | "locked",
            existingOrder.qty,
            existingOrder.unitPricePaise
          );

          if (!chargeResult.refused && chargeResult.chargePaise > 0) {
            await db
              .insert(ledgerEntries)
              .values({
                vendorId,
                customerId: existingOrder.customerId,
                orderId: existingOrder.id,
                type: "late_fee",
                amountPaise: chargeResult.chargePaise,
                notes: `Late skip fee for ${sub.product.name} on ${serviceDate}`,
                idempotencyKey: lateFeeKey(existingOrder.id),
                createdBy: access.user.id,
              })
              .onConflictDoNothing();
          }
        }
      }

      revalidatePath(`/merchant-panel/${slug}/today`);
      return { ok: true, isLate: tapIsLate };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Database error";
      return { ok: false, error: msg };
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

  try {
    const cur = new Date(startDate + "T00:00:00Z");
    const end = new Date(endDate + "T00:00:00Z");

    while (cur <= end) {
      const serviceDate = cur.toISOString().split("T")[0]!;

      for (const subId of targetSubIds) {
        await db
          .insert(dayChanges)
          .values({
            vendorId,
            subscriptionId: subId,
            serviceDate,
            kind: "skip",
            qty: 0,
            source: "pause",
            receivedAt: now,
            isLate: false,
          })
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

      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    if (token) revalidatePath(`/c/${token}`);
    if (slug) revalidatePath(`/merchant-panel/${slug}/today`);
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Database error";
    return { ok: false, error: msg };
  }
}
