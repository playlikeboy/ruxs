import "server-only";

import { and, desc, eq, ilike, or, count, sum, lte, gte } from "drizzle-orm";
import { getDb } from "@/db";
import { invoices, customers, vendors, ledgerEntries } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { istDateTime } from "@/core/time";

export interface AdminInvoiceFilters {
  period?: string;
  status?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export async function getAdminInvoices(filters: AdminInvoiceFilters = {}) {
  await requireAdmin();
  const db = getDb();

  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.max(1, Math.min(100, filters.limit ?? 20));
  const offset = (page - 1) * limit;

  const conditions = [];

  if (filters.period) {
    conditions.push(eq(invoices.period, filters.period));
  }
  if (filters.status) {
    conditions.push(eq(invoices.status, filters.status));
  }
  if (filters.q?.trim()) {
    const term = `%${filters.q.trim()}%`;
    conditions.push(
      or(
        ilike(invoices.number, term),
        ilike(customers.name, term),
        ilike(customers.phone, term),
        ilike(vendors.name, term)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countRes, statsRes, rows] = await Promise.all([
    db
      .select({ count: count() })
      .from(invoices)
      .innerJoin(vendors, eq(invoices.vendorId, vendors.id))
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .where(whereClause),

    db
      .select({
        totalCharges: sum(invoices.chargesPaise),
        totalPayments: sum(invoices.paymentsPaise),
        totalClosing: sum(invoices.closingPaise),
      })
      .from(invoices)
      .innerJoin(vendors, eq(invoices.vendorId, vendors.id))
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .where(whereClause),

    db
      .select({
        invoice: invoices,
        vendor: {
          id: vendors.id,
          name: vendors.name,
          slug: vendors.slug,
          city: vendors.city,
          phone: vendors.phone,
        },
        customer: {
          id: customers.id,
          name: customers.name,
          phone: customers.phone,
          flat: customers.flat,
          tower: customers.tower,
          society: customers.society,
        },
      })
      .from(invoices)
      .innerJoin(vendors, eq(invoices.vendorId, vendors.id))
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .where(whereClause)
      .orderBy(desc(invoices.period), desc(invoices.createdAt))
      .limit(limit)
      .offset(offset),
  ]);

  const total = countRes[0]?.count ?? 0;
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    rows,
    total,
    totalPages,
    page,
    limit,
    stats: {
      chargesPaise: Number(statsRes[0]?.totalCharges ?? 0),
      paymentsPaise: Number(statsRes[0]?.totalPayments ?? 0),
      closingPaise: Number(statsRes[0]?.totalClosing ?? 0),
    },
  };
}

export async function getAdminInvoicePeriods() {
  await requireAdmin();
  const db = getDb();
  const rows = await db
    .select({ period: invoices.period })
    .from(invoices)
    .groupBy(invoices.period)
    .orderBy(desc(invoices.period));
  return rows.map((r) => r.period);
}

export async function getAdminInvoiceDetail(invoiceId: string) {
  await requireAdmin();
  const db = getDb();

  const [row] = await db
    .select({
      invoice: invoices,
      vendor: vendors,
      customer: customers,
    })
    .from(invoices)
    .innerJoin(vendors, eq(invoices.vendorId, vendors.id))
    .innerJoin(customers, eq(invoices.customerId, customers.id))
    .where(eq(invoices.id, invoiceId))
    .limit(1);

  if (!row) return null;

  // Ledger entries within this billing period
  const period = row.invoice.period;
  const [yearStr, monthStr] = period.split("-");
  const year = parseInt(yearStr!, 10);
  const month = parseInt(monthStr!, 10);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextMonthStr = nextMonth.toString().padStart(2, "0");
  const monthStart = istDateTime(`${yearStr}-${monthStr}-01`, "00:00:00");
  const monthEnd = istDateTime(`${nextYear}-${nextMonthStr}-01`, "00:00:00");

  const entries = await db
    .select()
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.vendorId, row.vendor.id),
        eq(ledgerEntries.customerId, row.customer.id),
        gte(ledgerEntries.createdAt, monthStart),
        lte(ledgerEntries.createdAt, monthEnd)
      )
    )
    .orderBy(desc(ledgerEntries.createdAt));

  return {
    ...row,
    entries,
  };
}
