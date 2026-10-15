"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { consumers, customers, ledgerEntries, payments, shopOrders, vendors } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import { createRazorpayOrder, razorpayKeyId, verifyCheckoutSignature } from "@/lib/razorpay";
import { balance } from "@/core/ledger";
import { settlePayment } from "./settle";

export interface CheckoutOptions {
  keyId: string;
  razorpayOrderId: string;
  amountPaise: number;
  description: string;
  prefill: { name: string; email: string; contact: string };
}

type StartResult = { ok: true; checkout: CheckoutOptions } | { ok: false; error: string };

async function prefillFor(userId: string, email: string | null) {
  const db = getDb();
  const [p] = await db.select().from(consumers).where(eq(consumers.userId, userId)).limit(1);
  return { name: p?.name ?? "", email: email ?? p?.email ?? "", contact: p?.phone ?? "" };
}

/** Opens (or re-opens) Razorpay checkout for one of my unpaid online orders. */
export async function startOrderPayment(input: unknown): Promise<StartResult> {
  const parsed = z.object({ orderId: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid order" };

  const user = await requireUser();
  const keyId = razorpayKeyId();
  if (!keyId) return { ok: false, error: "Online payment is not available right now" };
  const db = getDb();

  const [order] = await db
    .select({ order: shopOrders, vendorName: vendors.name })
    .from(shopOrders)
    .innerJoin(vendors, eq(shopOrders.vendorId, vendors.id))
    .where(and(eq(shopOrders.id, parsed.data.orderId), eq(shopOrders.userId, user.id)))
    .limit(1);
  if (!order) return { ok: false, error: "Order not found" };
  if (order.order.paymentMode !== "online" || order.order.status !== "awaiting_payment") {
    return { ok: false, error: "This order does not need payment" };
  }

  // Reuse an open Razorpay order so retries don't create duplicates.
  const [existing] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.shopOrderId, order.order.id), eq(payments.status, "created")))
    .limit(1);

  let razorpayOrderId = existing?.razorpayOrderId;
  if (!razorpayOrderId) {
    try {
      const rzp = await createRazorpayOrder({
        amountPaise: order.order.totalPaise,
        receipt: order.order.number,
        notes: { shop_order_id: order.order.id, vendor: order.vendorName },
      });
      razorpayOrderId = rzp.id;
    } catch {
      return { ok: false, error: "Could not start the payment. Please try again." };
    }
    await db.insert(payments).values({
      vendorId: order.order.vendorId,
      customerId: order.order.customerId,
      userId: user.id,
      purpose: "shop_order",
      shopOrderId: order.order.id,
      amountPaise: order.order.totalPaise,
      razorpayOrderId,
    });
  }

  return {
    ok: true,
    checkout: {
      keyId,
      razorpayOrderId,
      amountPaise: order.order.totalPaise,
      description: `${order.vendorName} · ${order.order.number}`,
      prefill: await prefillFor(user.id, user.primaryEmail),
    },
  };
}

/** Pays the full balance I owe one store (monthly plan bills). */
export async function startDuesPayment(input: unknown): Promise<StartResult> {
  const parsed = z.object({ vendorId: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid store" };

  const user = await requireUser();
  const keyId = razorpayKeyId();
  if (!keyId) return { ok: false, error: "Online payment is not available right now" };
  const db = getDb();

  const [customer] = await db
    .select({ id: customers.id, vendorName: vendors.name })
    .from(customers)
    .innerJoin(vendors, eq(customers.vendorId, vendors.id))
    .where(and(eq(customers.vendorId, parsed.data.vendorId), eq(customers.userId, user.id)))
    .limit(1);
  if (!customer) return { ok: false, error: "Store not found" };

  const rows = await db
    .select({ amountPaise: ledgerEntries.amountPaise })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.customerId, customer.id));
  const duePaise = balance(rows);
  if (duePaise < 100) return { ok: false, error: "Nothing to pay right now" };

  let razorpayOrderId: string;
  try {
    const rzp = await createRazorpayOrder({
      amountPaise: duePaise,
      receipt: `DUES-${customer.id.slice(0, 8)}-${Date.now().toString(36)}`,
      notes: { customer_id: customer.id, vendor: customer.vendorName },
    });
    razorpayOrderId = rzp.id;
  } catch {
    return { ok: false, error: "Could not start the payment. Please try again." };
  }
  await db.insert(payments).values({
    vendorId: parsed.data.vendorId,
    customerId: customer.id,
    userId: user.id,
    purpose: "dues",
    amountPaise: duePaise,
    razorpayOrderId,
  });

  return {
    ok: true,
    checkout: {
      keyId,
      razorpayOrderId,
      amountPaise: duePaise,
      description: `Dues · ${customer.vendorName}`,
      prefill: await prefillFor(user.id, user.primaryEmail),
    },
  };
}

/** Browser callback after Razorpay checkout succeeds. The webhook is the backup. */
export async function confirmCheckout(input: unknown) {
  const parsed = z
    .object({
      razorpayOrderId: z.string().min(1),
      razorpayPaymentId: z.string().min(1),
      razorpaySignature: z.string().min(1),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid payment response" };

  const user = await requireUser();
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;
  if (!verifyCheckoutSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
    return { ok: false as const, error: "Payment could not be verified" };
  }

  const db = getDb();
  const [mine] = await db
    .select({ id: payments.id })
    .from(payments)
    .where(and(eq(payments.razorpayOrderId, razorpayOrderId), eq(payments.userId, user.id)))
    .limit(1);
  if (!mine) return { ok: false as const, error: "Payment not found" };

  const result = await settlePayment({ razorpayOrderId, razorpayPaymentId });
  revalidatePath("/app/orders");
  revalidatePath("/app/plans");
  if (result.shopOrderId) revalidatePath(`/app/orders/${result.shopOrderId}`);
  return { ok: true as const, shopOrderId: result.shopOrderId };
}
