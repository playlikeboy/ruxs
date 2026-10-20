"use server";

import { revalidatePath } from "next/cache";
import { eq, and, lte } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { invoices, ledgerEntries } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { computeInvoice } from "@/core/billing";
import { istDateTime } from "@/core/time";

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
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, parsed.data.invoiceId))
    .limit(1);

  if (!invoice) {
    return { ok: false, error: "Invoice not found" };
  }

  if (invoice.status === "paid") {
    return { ok: true, message: "Invoice is already paid" };
  }

  const outstanding = invoice.closingPaise;

  // If there's an outstanding balance, record a payment ledger entry (Rule: never UPDATE/DELETE ledger rows)
  if (outstanding > 0) {
    const key = `inv-admin-pay:${invoice.id}:${Date.now()}`;
    await db.insert(ledgerEntries).values({
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
  await db
    .update(invoices)
    .set({
      status: "paid",
      paymentsPaise: invoice.paymentsPaise + Math.max(0, outstanding),
      closingPaise: 0,
      paidAt: new Date(),
    })
    .where(eq(invoices.id, invoice.id));

  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/invoices/${invoice.id}`);
  return { ok: true };
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

  const [yearStr, monthStr] = invoice.period.split("-");
  const year = parseInt(yearStr!, 10);
  const month = parseInt(monthStr!, 10);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextMonthStr = nextMonth.toString().padStart(2, "0");
  const monthEnd = istDateTime(`${nextYear}-${nextMonthStr}-01`, "00:00:00");

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
        lte(ledgerEntries.createdAt, monthEnd)
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
