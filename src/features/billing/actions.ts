"use server";

import { revalidatePath } from "next/cache";
import { eq, and, lte, count } from "drizzle-orm";
import { getDb } from "@/db";
import { invoices, customers, ledgerEntries } from "@/db/schema";
import { requireVendorAccess } from "@/lib/auth/session";
import { computeInvoice, formatInvoiceNumber } from "@/core/billing";
import { istDateTime } from "@/core/time";
import { generateMonthlyBillsSchema, markBillSentSchema } from "./schemas";

export async function generateBillsForVendor(
  vendorId: string,
  period: string,
  database?: ReturnType<typeof getDb>
) {
  const db = database ?? getDb();

  // 1. Fetch all customers of this vendor
  const custList = await db
    .select({ id: customers.id, name: customers.name })
    .from(customers)
    .where(eq(customers.vendorId, vendorId));

  if (custList.length === 0) {
    return { created: 0, skipped: 0 };
  }

  // 2. Count existing invoices for this vendor in this period
  const [existingCountRow] = await db
    .select({ count: count() })
    .from(invoices)
    .where(
      and(
        eq(invoices.vendorId, vendorId),
        eq(invoices.period, period)
      )
    );
  let seq = (existingCountRow?.count ?? 0);

  // Period end date
  const [yearStr, monthStr] = period.split("-");
  const year = parseInt(yearStr!, 10);
  const month = parseInt(monthStr!, 10);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextMonthStr = nextMonth.toString().padStart(2, "0");
  const monthEnd = istDateTime(`${nextYear}-${nextMonthStr}-01`, "00:00:00");

  let createdCount = 0;
  let skippedCount = 0;

  for (const cust of custList) {
    // Check if invoice already exists
    const [existing] = await db
      .select({ id: invoices.id })
      .from(invoices)
      .where(
        and(
          eq(invoices.vendorId, vendorId),
          eq(invoices.customerId, cust.id),
          eq(invoices.period, period)
        )
      )
      .limit(1);

    if (existing) {
      skippedCount++;
      continue;
    }

    // Fetch all ledger entries up to month end
    const entries = await db
      .select({
        type: ledgerEntries.type,
        amountPaise: ledgerEntries.amountPaise,
        createdAt: ledgerEntries.createdAt,
      })
      .from(ledgerEntries)
      .where(
        and(
          eq(ledgerEntries.vendorId, vendorId),
          eq(ledgerEntries.customerId, cust.id),
          lte(ledgerEntries.createdAt, monthEnd)
        )
      );

    const computed = computeInvoice(entries, period);

    // If zero balance and no charges/payments, skip creating an empty bill
    if (
      computed.openingPaise === 0 &&
      computed.chargesPaise === 0 &&
      computed.paymentsPaise === 0 &&
      computed.closingPaise === 0
    ) {
      skippedCount++;
      continue;
    }

    seq++;
    const billNumber = formatInvoiceNumber(period, seq);
    const status = computed.closingPaise <= 0 ? "paid" : "generated";

    await db
      .insert(invoices)
      .values({
        vendorId,
        customerId: cust.id,
        period,
        number: billNumber,
        openingPaise: computed.openingPaise,
        chargesPaise: computed.chargesPaise,
        paymentsPaise: computed.paymentsPaise,
        closingPaise: computed.closingPaise,
        status,
        paidAt: computed.closingPaise <= 0 ? new Date() : null,
      })
      .onConflictDoNothing();

    createdCount++;
  }

  return { created: createdCount, skipped: skippedCount };
}

export async function generateMonthlyBillsAction(input: unknown) {
  const parsed = generateMonthlyBillsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { slug, period } = parsed.data;
  const access = await requireVendorAccess(slug, ["owner"]);

  try {
    const result = await generateBillsForVendor(access.vendorId, period);
    revalidatePath(`/merchant-panel/${slug}/bills`);
    return { ok: true, data: result };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to generate monthly bills";
    return { ok: false, error: msg };
  }
}

export async function markBillSent(input: unknown) {
  const parsed = markBillSentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { slug, invoiceId } = parsed.data;
  const access = await requireVendorAccess(slug, ["owner", "staff"]);
  const db = getDb();

  try {
    const [inv] = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.id, invoiceId),
          eq(invoices.vendorId, access.vendorId)
        )
      )
      .limit(1);

    if (!inv) {
      return { ok: false, error: "Invoice not found" };
    }

    await db
      .update(invoices)
      .set({
        sentAt: new Date(),
        status: inv.status === "generated" ? "sent" : inv.status,
      })
      .where(eq(invoices.id, inv.id));

    revalidatePath(`/merchant-panel/${slug}/bills`);
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to mark bill as sent";
    return { ok: false, error: msg };
  }
}
