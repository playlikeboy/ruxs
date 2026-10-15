import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { dayChanges, ledgerEntries, orders, products, subscriptions } from "@/db/schema";
import { isLate, lateCharge, type LateRule } from "@/core/cutoff";
import { lateFeeKey } from "@/core/ledger";

/**
 * A household changing one day of its own subscription, from the private link
 * or the signed-in app. The caller has already proved who the customer is.
 */
export async function applyHouseholdDayChange(input: {
  vendorId: string;
  customerId: string;
  subscriptionId: string;
  serviceDate: string;
  kind: "skip" | "extra" | "qty";
  qty: number;
}): Promise<{ ok: true; isLate: boolean } | { ok: false; error: string }> {
  const { vendorId, customerId, subscriptionId, serviceDate, kind, qty } = input;
  const db = getDb();

  const [sub] = await db
    .select({ sub: subscriptions, product: products })
    .from(subscriptions)
    .innerJoin(products, eq(subscriptions.productId, products.id))
    .where(
      and(
        eq(subscriptions.id, subscriptionId),
        eq(subscriptions.customerId, customerId),
        eq(subscriptions.vendorId, vendorId)
      )
    )
    .limit(1);

  if (!sub) {
    return { ok: false, error: "Subscription not found" };
  }

  const now = new Date();
  const tapIsLate = isLate(now, serviceDate, sub.product.cutoffAt);

  if (tapIsLate && (sub.product.lateRule === "locked" || kind !== "skip")) {
    return {
      ok: false,
      error: `Cutoff passed at ${sub.product.cutoffAt} IST. Kitchen count is locked.`,
    };
  }

  await db
    .insert(dayChanges)
    .values({ vendorId, subscriptionId, serviceDate, kind, qty, source: "link", receivedAt: now, isLate: tapIsLate })
    .onConflictDoUpdate({
      target: [dayChanges.subscriptionId, dayChanges.serviceDate],
      set: { kind, qty, source: "link", receivedAt: now, isLate: tapIsLate },
    });

  if (tapIsLate && kind === "skip") {
    // Late skip: the count is already locked, so the charge changes, not the count.
    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.subscriptionId, subscriptionId), eq(orders.serviceDate, serviceDate)))
      .limit(1);

    if (existingOrder && existingOrder.status === "confirmed") {
      await db.update(orders).set({ status: "late_skip" }).where(eq(orders.id, existingOrder.id));

      const chargeResult = lateCharge(
        sub.product.lateRule as LateRule,
        existingOrder.qty,
        existingOrder.unitPricePaise
      );

      if (!chargeResult.refused && chargeResult.chargePaise > 0) {
        await db
          .insert(ledgerEntries)
          .values({
            vendorId,
            customerId,
            orderId: existingOrder.id,
            type: "late_fee",
            amountPaise: chargeResult.chargePaise,
            notes: `Late skip fee for ${sub.product.name} on ${serviceDate}`,
            idempotencyKey: lateFeeKey(existingOrder.id),
            createdBy: customerId,
          })
          .onConflictDoNothing();
      }
    }
  }

  return { ok: true, isLate: tapIsLate };
}
