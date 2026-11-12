import "server-only";
import { eq, and, lt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { invoices, customers, ledgerEntries } from "@/db/schema";
import { computeInvoice, formatInvoiceNumber, type LedgerEntryForInvoice } from "@/core/billing";
import { periodBounds } from "./period";

const INSERT_CHUNK = 500;

/**
 * Creates monthly invoices for one vendor from the ledger.
 * Internal: callers must authorize first (guarded action or cron). Never export from a "use server" module.
 *
 * Runs in one transaction under a per-vendor/period advisory lock so a cron
 * tick and a manual "Generate bills" tap cannot hand out the same bill number.
 */
export async function generateBillsForVendor(
  vendorId: string,
  period: string,
  database?: ReturnType<typeof getDb>
) {
  const db = database ?? getDb();
  const { end: monthEnd } = periodBounds(period);

  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`bills:${vendorId}:${period}`}))`);

    // One query each for customers, existing bills and ledger rows (no per-customer round trips).
    const [custList, existing, entries] = await Promise.all([
      tx.select({ id: customers.id }).from(customers).where(eq(customers.vendorId, vendorId)),
      tx
        .select({ customerId: invoices.customerId })
        .from(invoices)
        .where(and(eq(invoices.vendorId, vendorId), eq(invoices.period, period))),
      tx
        .select({
          customerId: ledgerEntries.customerId,
          type: ledgerEntries.type,
          amountPaise: ledgerEntries.amountPaise,
          createdAt: ledgerEntries.createdAt,
        })
        .from(ledgerEntries)
        .where(and(eq(ledgerEntries.vendorId, vendorId), lt(ledgerEntries.createdAt, monthEnd))),
    ]);

    if (custList.length === 0) {
      return { created: 0, skipped: 0 };
    }

    const billed = new Set(existing.map((e) => e.customerId));
    const entriesByCustomer = new Map<string, LedgerEntryForInvoice[]>();
    for (const { customerId, ...entry } of entries) {
      const list = entriesByCustomer.get(customerId);
      if (list) list.push(entry);
      else entriesByCustomer.set(customerId, [entry]);
    }

    let seq = existing.length;
    let skippedCount = 0;
    const now = new Date();
    const rows: (typeof invoices.$inferInsert)[] = [];

    for (const cust of custList) {
      if (billed.has(cust.id)) {
        skippedCount++;
        continue;
      }

      const computed = computeInvoice(entriesByCustomer.get(cust.id) ?? [], period);

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
      const paid = computed.closingPaise <= 0;
      rows.push({
        vendorId,
        customerId: cust.id,
        period,
        number: formatInvoiceNumber(period, seq),
        openingPaise: computed.openingPaise,
        chargesPaise: computed.chargesPaise,
        paymentsPaise: computed.paymentsPaise,
        closingPaise: computed.closingPaise,
        status: paid ? "paid" : "generated",
        paidAt: paid ? now : null,
      });
    }

    if (rows.length === 0) {
      return { created: 0, skipped: skippedCount };
    }

    // Chunked so a large vendor stays well under Postgres' bind-parameter limit.
    let created = 0;
    for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
      const inserted = await tx
        .insert(invoices)
        .values(rows.slice(i, i + INSERT_CHUNK))
        .onConflictDoNothing()
        .returning({ id: invoices.id });
      created += inserted.length;
    }

    return { created, skipped: skippedCount + (rows.length - created) };
  });
}
