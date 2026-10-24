"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, products, ledgerEntries, assetMovements } from "@/db/schema";
import { requireVendorAccess } from "@/lib/auth/session";
import { deliveryKey, depositKey } from "@/core/ledger";
import { markDeliveredSchema, markFailedSchema } from "./schemas";

export async function markDelivered(input: unknown) {
  const parsed = markDeliveredSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { slug, orderId, cansOut, cansIn } = parsed.data;
  const access = await requireVendorAccess(slug, ["owner", "staff", "driver"]);
  const db = getDb();

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Fetch order joined with product
      const [row] = await tx
        .select({
          order: orders,
          product: products,
        })
        .from(orders)
        .innerJoin(products, eq(orders.productId, products.id))
        .where(
          and(
            eq(orders.id, orderId),
            eq(orders.vendorId, access.vendorId)
          )
        )
        .limit(1);

      if (!row) {
        throw new Error("Order not found");
      }

      const { order, product } = row;
      const now = new Date();

      // 2. Update order to delivered
      await tx
        .update(orders)
        .set({
          status: "delivered",
          deliveredAt: now,
          deliveredBy: access.user.id,
        })
        .where(eq(orders.id, order.id));

      // 3. Insert delivery ledger entry (idempotent)
      const chargePaise = order.unitPricePaise * order.qty;
      const delKey = deliveryKey(order.id);

      await tx
        .insert(ledgerEntries)
        .values({
          vendorId: access.vendorId,
          customerId: order.customerId,
          orderId: order.id,
          type: "delivery",
          amountPaise: chargePaise,
          notes: `${product.name} delivered on ${order.serviceDate}`,
          idempotencyKey: delKey,
          createdBy: access.user.id,
          createdAt: now,
        })
        .onConflictDoNothing();

      // 4. Asset movements (if product has asset tracking like cans or dabbas)
      if (product.assetName) {
        const delta = cansOut - cansIn;
        if (delta !== 0 || cansOut > 0 || cansIn > 0) {
          await tx.insert(assetMovements).values({
            vendorId: access.vendorId,
            customerId: order.customerId,
            orderId: order.id,
            asset: product.assetName,
            delta,
            createdAt: now,
          });
        }

        // 5. First-time deposit entry if applicable
        if (product.depositPaise > 0) {
          const depKey = depositKey(order.customerId, product.assetName);
          await tx
            .insert(ledgerEntries)
            .values({
              vendorId: access.vendorId,
              customerId: order.customerId,
              orderId: order.id,
              type: "deposit",
              amountPaise: product.depositPaise,
              notes: `Deposit for ${product.assetName}`,
              idempotencyKey: depKey,
              createdBy: access.user.id,
              createdAt: now,
            })
            .onConflictDoNothing();
        }
      }

      return { ok: true };
    });

    revalidatePath(`/merchant-panel/${slug}/run`);
    revalidatePath(`/merchant-panel/${slug}/today`);
    return result;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Delivery record failed";
    return { ok: false, error: msg };
  }
}

export async function markFailed(input: unknown) {
  const parsed = markFailedSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { slug, orderId, reason } = parsed.data;
  const access = await requireVendorAccess(slug, ["owner", "staff", "driver"]);
  const db = getDb();

  try {
    const [updated] = await db
      .update(orders)
      .set({
        status: "failed",
        failedReason: reason,
      })
      .where(
        and(
          eq(orders.id, orderId),
          eq(orders.vendorId, access.vendorId)
        )
      )
      .returning();

    if (!updated) {
      return { ok: false, error: "Order not found" };
    }

    revalidatePath(`/merchant-panel/${slug}/run`);
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed update failed";
    return { ok: false, error: msg };
  }
}
