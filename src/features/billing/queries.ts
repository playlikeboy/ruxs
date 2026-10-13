import "server-only";

import { eq, and, desc, lte } from "drizzle-orm";
import { getDb } from "@/db";
import { invoices, customers, vendors, ledgerEntries } from "@/db/schema";
import { requireVendorAccess, requireCustomerByToken } from "@/lib/auth/session";
import { buildUpiUrl } from "@/core/upi";
import { istDateTime } from "@/core/time";

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
  const [yearStr, monthStr] = period.split("-");
  const year = parseInt(yearStr!, 10);
  const month = parseInt(monthStr!, 10);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextMonthStr = nextMonth.toString().padStart(2, "0");
  const monthEnd = istDateTime(`${nextYear}-${nextMonthStr}-01`, "00:00:00");

  const entries = await db
    .select()
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.vendorId, customer.vendorId),
        eq(ledgerEntries.customerId, customer.id),
        lte(ledgerEntries.createdAt, monthEnd)
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
