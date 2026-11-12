"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { ledgerEntries, invoices, customers } from "@/db/schema";
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

  const amountPaise = rupeesToPaise(amountRupees);
  if (amountPaise === 0) {
    return { ok: false, error: "Adjustment amount cannot be zero" };
  }

  try {
    // customerId comes from the client: it must belong to this vendor before money moves.
    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.vendorId, access.vendorId)))
      .limit(1);
    if (!customer) {
      return { ok: false, error: "Customer not found" };
    }

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

    revalidatePath(`/merchant-panel/${slug}/customers/${customerId}`);
    revalidatePath(`/merchant-panel/${slug}/bills`);
    return { ok: true };
  } catch (err: unknown) {
    console.error("[ledger] addAdjustment failed", err);
    return { ok: false, error: "Failed to add adjustment" };
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

  const amountPaise = rupeesToPaise(amountRupees);
  if (amountPaise <= 0) {
    return { ok: false, error: "Payment amount must be greater than zero" };
  }

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Fetch and lock the invoice so two concurrent payments cannot lose an update
      const [invoice] = await tx
        .select()
        .from(invoices)
        .where(
          and(
            eq(invoices.id, invoiceId),
            eq(invoices.vendorId, access.vendorId)
          )
        )
        .limit(1)
        .for("update");

      if (!invoice) {
        return { ok: false, error: "Invoice not found" };
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

    if (result.ok) revalidatePath(`/merchant-panel/${slug}/bills`);
    return result;
  } catch (err: unknown) {
    console.error("[ledger] markPaid failed", err);
    return { ok: false, error: "Failed to record payment" };
  }
}
