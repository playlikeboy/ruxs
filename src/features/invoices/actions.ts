"use server";

import { revalidatePath } from "next/cache";
import { eq, and, lt } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { invoices, ledgerEntries } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { computeInvoice } from "@/core/billing";
import { periodBounds } from "@/features/billing/period";

const markInvoicePaidSchema = z.object({
  invoiceId: z.string().min(1),
  notes: z.string().max(200).optional(),
});

export async function markAdminInvoicePaid(input: unknown) {
  const { user } = await requireAdmin();
  const parsed = markInvoicePaidSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const db = getDb();
  // Row lock + one transaction: a double click cannot write two balancing payments,
  // and the ledger entry and the invoice update land together or not at all.
  const result = await db.transaction(async (tx) => {
    const [invoice] = await tx
      .select()
      .from(invoices)
      .where(eq(invoices.id, parsed.data.invoiceId))
      .limit(1)
      .for("update");

    if (!invoice) {
      return { ok: false as const, error: "Invoice not found" };
    }

    if (invoice.status === "paid") {
      return { ok: true as const, invoiceId: invoice.id, message: "Invoice is already paid" };
    }

    const outstanding = invoice.closingPaise;

    // If there's an outstanding balance, record a payment ledger entry (Rule: never UPDATE/DELETE ledger rows)
    if (outstanding > 0) {
      const key = `inv-admin-pay:${invoice.id}:${Date.now()}`;
      await tx.insert(ledgerEntries).values({
        vendorId: invoice.vendorId,
        customerId: invoice.customerId,
        invoiceId: invoice.id,
        type: "payment",
        amountPaise: -outstanding, // negative = payment reduces debt
        notes: parsed.data.notes || `Paid via Admin console by ${user.id}`,
        idempotencyKey: key,
        createdBy: `admin:${user.id}`,
      });
    }

    // Update invoice status to paid
    await tx
      .update(invoices)
      .set({
        status: "paid",
        paymentsPaise: invoice.paymentsPaise + Math.max(0, outstanding),
        closingPaise: 0,
        paidAt: new Date(),
      })
      .where(eq(invoices.id, invoice.id));

    return { ok: true as const, invoiceId: invoice.id, message: undefined };
  });

  if (!result.ok) {
    return result;
  }

  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/invoices/${result.invoiceId}`);
  return result.message ? { ok: true, message: result.message } : { ok: true };
}

const regenerateInvoiceSchema = z.object({
  invoiceId: z.string().min(1),
});

export async function regenerateAdminInvoice(input: unknown) {
  await requireAdmin();
  const parsed = regenerateInvoiceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const db = getDb();
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, parsed.data.invoiceId))
    .limit(1);

  if (!invoice) {
    return { ok: false, error: "Invoice not found" };
  }

  const { end: monthEnd } = periodBounds(invoice.period);

  const entries = await db
    .select({
      type: ledgerEntries.type,
      amountPaise: ledgerEntries.amountPaise,
      createdAt: ledgerEntries.createdAt,
    })
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.vendorId, invoice.vendorId),
        eq(ledgerEntries.customerId, invoice.customerId),
        lt(ledgerEntries.createdAt, monthEnd)
      )
    );

  const computed = computeInvoice(entries, invoice.period);

  await db
    .update(invoices)
    .set({
      openingPaise: computed.openingPaise,
      chargesPaise: computed.chargesPaise,
      paymentsPaise: computed.paymentsPaise,
      closingPaise: computed.closingPaise,
      status: computed.closingPaise <= 0 ? "paid" : "generated",
    })
    .where(eq(invoices.id, invoice.id));

  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/invoices/${invoice.id}`);
  return { ok: true };
}
