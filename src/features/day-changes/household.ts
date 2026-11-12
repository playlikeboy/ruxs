import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { dayChanges, ledgerEntries, orders, products, subscriptions } from "@/db/schema";
import { isLate, lateCharge, type LateRule } from "@/core/cutoff";
import { lateFeeKey } from "@/core/ledger";

type DayChangeKind = "skip" | "extra" | "qty";

/**
 * Upserts one day change and, for a late skip, flips the locked order to
 * `late_skip` and records the late fee. All writes share one transaction so a
 * failure never leaves an order skipped without its fee (or the reverse).
 * The caller has already proved who is acting and that the subscription is theirs.
 */
export async function writeDayChange(input: {
  vendorId: string;
  subscriptionId: string;
  serviceDate: string;
  kind: DayChangeKind;
  qty: number;
  source: "link" | "vendor";
  isLate: boolean;
  receivedAt: Date;
  product: { name: string; lateRule: string };
  actorId: string;
}) {
  const { vendorId, subscriptionId, serviceDate, kind, qty, source, receivedAt, product, actorId } = input;
  const tapIsLate = input.isLate;

  await getDb().transaction(async (tx) => {
    await tx
      .insert(dayChanges)
      .values({ vendorId, subscriptionId, serviceDate, kind, qty, source, receivedAt, isLate: tapIsLate })
      .onConflictDoUpdate({
        target: [dayChanges.subscriptionId, dayChanges.serviceDate],
        set: { kind, qty, source, receivedAt, isLate: tapIsLate },
      });

    if (!tapIsLate || kind !== "skip") return;

    // Late skip: the count is already locked, so the charge changes, not the count.
    // The status guard makes a repeated tap a no-op instead of a second transition.
    const lateSkipped = await tx
      .update(orders)
      .set({ status: "late_skip" })
      .where(
        and(
          eq(orders.subscriptionId, subscriptionId),
          eq(orders.serviceDate, serviceDate),
          eq(orders.vendorId, vendorId),
          eq(orders.status, "confirmed")
        )
      )
      .returning({
        id: orders.id,
        customerId: orders.customerId,
        qty: orders.qty,
        unitPricePaise: orders.unitPricePaise,
      });

    for (const order of lateSkipped) {
      const chargeResult = lateCharge(product.lateRule as LateRule, order.qty, order.unitPricePaise);
      if (chargeResult.refused || chargeResult.chargePaise <= 0) continue;

      await tx
        .insert(ledgerEntries)
        .values({
          vendorId,
          customerId: order.customerId,
          orderId: order.id,
          type: "late_fee",
          amountPaise: chargeResult.chargePaise,
          notes: `Late skip fee for ${product.name} on ${serviceDate}`,
          idempotencyKey: lateFeeKey(order.id),
          createdBy: actorId,
        })
        .onConflictDoNothing();
    }
  });
}

/**
 * A household changing one day of its own subscription, from the private link
 * or the signed-in app. The caller has already proved who the customer is.
 */
export async function applyHouseholdDayChange(input: {
  vendorId: string;
  customerId: string;
  subscriptionId: string;
  serviceDate: string;
  kind: DayChangeKind;
  qty: number;
}): Promise<{ ok: true; isLate: boolean } | { ok: false; error: string }> {
  const { vendorId, customerId, subscriptionId, serviceDate, kind, qty } = input;
  const db = getDb();

  const [sub] = await db
    .select({ product: { name: products.name, cutoffAt: products.cutoffAt, lateRule: products.lateRule } })
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

  await writeDayChange({
    vendorId,
    subscriptionId,
    serviceDate,
    kind,
    qty,
    source: "link",
    isLate: tapIsLate,
    receivedAt: now,
    product: sub.product,
    actorId: customerId,
  });

  return { ok: true, isLate: tapIsLate };
}
