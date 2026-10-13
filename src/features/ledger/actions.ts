"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { ledgerEntries, invoices } from "@/db/schema";
import { requireVendorAccess } from "@/lib/auth/session";
import { rupeesToPaise } from "@/core/money";
import { adjustmentKey, paymentKey } from "@/core/ledger";
import { addAdjustmentSchema, markPaidSchema } from "./schemas";

export async function addAdjustment(input: unknown) {
  const parsed = addAdjustmentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { slug, customerId, amountRupees, notes } = parsed.data;
  const access = await requireVendorAccess(slug, ["owner", "staff"]);
  const db = getDb();

  try {
    const amountPaise = rupeesToPaise(amountRupees);
    const key = adjustmentKey(crypto.randomUUID());

    await db.insert(ledgerEntries).values({
      vendorId: access.vendorId,
      customerId,
      type: "adjustment",
      amountPaise,
      notes,
      idempotencyKey: key,
      createdBy: access.user.id,
    });

    revalidatePath(`/app/${slug}/customers/${customerId}`);
    revalidatePath(`/app/${slug}/bills`);
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to add adjustment";
    return { ok: false, error: msg };
  }
}

export async function markPaid(input: unknown) {
  const parsed = markPaidSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { slug, invoiceId, amountRupees, notes } = parsed.data;
  const access = await requireVendorAccess(slug, ["owner", "staff"]);
  const db = getDb();

  try {
    const amountPaise = rupeesToPaise(amountRupees);
    if (amountPaise <= 0) {
      return { ok: false, error: "Payment amount must be greater than zero" };
    }

    const result = await db.transaction(async (tx) => {
      // 1. Fetch invoice
      const [invoice] = await tx
        .select()
        .from(invoices)
        .where(
          and(
            eq(invoices.id, invoiceId),
            eq(invoices.vendorId, access.vendorId)
          )
        )
        .limit(1);

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      // 2. Insert payment into ledger (negative amount reduces balance)
      const payKey = paymentKey(invoice.id, crypto.randomUUID());
      await tx.insert(ledgerEntries).values({
        vendorId: access.vendorId,
        customerId: invoice.customerId,
        invoiceId: invoice.id,
        type: "payment",
        amountPaise: -amountPaise,
        notes: notes || `Payment received for ${invoice.number}`,
        idempotencyKey: payKey,
        createdBy: access.user.id,
      });

      // 3. Update invoice payment total and status
      const updatedPayments = invoice.paymentsPaise + amountPaise;
      const updatedClosing = invoice.closingPaise - amountPaise;
      const newStatus = updatedClosing <= 0 ? "paid" : "partially_paid";

      await tx
        .update(invoices)
        .set({
          paymentsPaise: updatedPayments,
          closingPaise: updatedClosing,
          status: newStatus,
          paidAt: updatedClosing <= 0 ? new Date() : invoice.paidAt,
        })
        .where(eq(invoices.id, invoice.id));

      return { ok: true };
    });

    revalidatePath(`/app/${slug}/bills`);
    return result;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to record payment";
    return { ok: false, error: msg };
  }
}
