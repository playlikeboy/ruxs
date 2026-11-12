import "server-only";

import { eq, and, desc, lt, gte } from "drizzle-orm";
import { getDb } from "@/db";
import { invoices, customers, ledgerEntries } from "@/db/schema";
import { requireVendorAccess, requireCustomerByToken } from "@/lib/auth/session";
import { buildUpiUrl } from "@/core/upi";
import { periodBounds } from "./period";

const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export async function getVendorBills(slug: string, period?: string) {
  const access = await requireVendorAccess(slug, ["owner", "staff"]);
  const db = getDb();

  const conditions = [eq(invoices.vendorId, access.vendorId)];
  if (period) {
    conditions.push(eq(invoices.period, period));
  }

  return db
    .select({
      invoice: invoices,
      customer: customers,
    })
    .from(invoices)
    .innerJoin(customers, eq(invoices.customerId, customers.id))
    .where(and(...conditions))
    .orderBy(desc(invoices.period), desc(invoices.createdAt));
}

export async function getCustomerBillByToken(token: string, period: string) {
  const { customer, vendor } = await requireCustomerByToken(token);
  // The period comes from the URL: reject anything that is not a real YYYY-MM month.
  if (!PERIOD_RE.test(period)) {
    return null;
  }
  const db = getDb();

  const [invoice] = await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.vendorId, customer.vendorId),
        eq(invoices.customerId, customer.id),
        eq(invoices.period, period)
      )
    )
    .limit(1);

  if (!invoice) {
    return null;
  }

  // Calculate UPI url if vendor has UPI ID and invoice has positive closing balance
  const upiUrl =
    vendor.upiVpa && invoice.closingPaise > 0
      ? buildUpiUrl({
          vpa: vendor.upiVpa,
          payeeName: vendor.name,
          amountPaise: invoice.closingPaise,
          billNumber: invoice.number,
        })
      : null;

  // Fetch itemized ledger entries for this month
  const { start: monthStart, end: monthEnd } = periodBounds(period);

  const entries = await db
    .select()
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.vendorId, customer.vendorId),
        eq(ledgerEntries.customerId, customer.id),
        gte(ledgerEntries.createdAt, monthStart),
        lt(ledgerEntries.createdAt, monthEnd)
      )
    )
    .orderBy(desc(ledgerEntries.createdAt));

  return {
    invoice,
    customer,
    vendor,
    upiUrl,
    entries,
  };
}
