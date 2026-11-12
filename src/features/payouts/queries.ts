import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { bookings, customers, payments, services, shopOrders, vendorPayouts, vendors } from "@/db/schema";
import { requireAdmin, requireVendorAccess } from "@/lib/auth/session";
import { paymentState, vendorBalance, type BalancePayout } from "@/core/payouts";

type BalanceReader = Pick<ReturnType<typeof getDb>, "select">;

/** Paid online money and payouts, optionally limited to one vendor. */
function balanceRows(db: BalanceReader, vendorId?: string) {
  return Promise.all([
    db
      .select({
        vendorId: payments.vendorId,
        amountPaise: payments.amountPaise,
        purpose: payments.purpose,
        orderStatus: shopOrders.status,
        bookingStatus: bookings.status,
      })
      .from(payments)
      .leftJoin(shopOrders, eq(payments.shopOrderId, shopOrders.id))
      .leftJoin(bookings, eq(payments.bookingId, bookings.id))
      .where(vendorId ? and(eq(payments.vendorId, vendorId), eq(payments.status, "paid")) : eq(payments.status, "paid")),
    db
      .select({ vendorId: vendorPayouts.vendorId, amountPaise: vendorPayouts.amountPaise, status: vendorPayouts.status })
      .from(vendorPayouts)
      .where(vendorId ? eq(vendorPayouts.vendorId, vendorId) : undefined),
  ]);
}

type PaidRow = Awaited<ReturnType<typeof balanceRows>>[0][number];
type PayoutRow = Awaited<ReturnType<typeof balanceRows>>[1][number];

function toBalance(paid: PaidRow[], payouts: PayoutRow[], commissionBps: number) {
  return vendorBalance(
    paid.map((p) => ({
      amountPaise: p.amountPaise,
      state: paymentState(p.purpose as "shop_order" | "dues" | "booking", p.purpose === "booking" ? p.bookingStatus : p.orderStatus),
    })),
    payouts.map((p) => ({ amountPaise: p.amountPaise, status: p.status as BalancePayout["status"] })),
    commissionBps
  );
}

function groupByVendor<T extends { vendorId: string }>(rows: T[]): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const row of rows) {
    const list = out.get(row.vendorId);
    if (list) list.push(row);
    else out.set(row.vendorId, [row]);
  }
  return out;
}

/**
 * Balance for one vendor. No auth check: callers must have checked access.
 * Pass a transaction as `database` to read inside it (e.g. under a payout lock).
 */
export async function computeVendorBalance(vendorId: string, commissionBps: number, database?: BalanceReader) {
  const [paid, payouts] = await balanceRows(database ?? getDb(), vendorId);
  return toBalance(paid, payouts, commissionBps);
}

export async function getVendorEarnings(slug: string) {
  const access = await requireVendorAccess(slug, ["owner", "staff"]);
  const db = getDb();
  const [balance, recent, payouts] = await Promise.all([
    computeVendorBalance(access.vendorId, access.vendor.commissionBps),
    db
      .select({
        payment: payments,
        customerName: customers.name,
        orderNumber: shopOrders.number,
        orderStatus: shopOrders.status,
        bookingNumber: bookings.number,
        bookingStatus: bookings.status,
        serviceName: services.name,
      })
      .from(payments)
      .innerJoin(customers, eq(payments.customerId, customers.id))
      .leftJoin(shopOrders, eq(payments.shopOrderId, shopOrders.id))
      .leftJoin(bookings, eq(payments.bookingId, bookings.id))
      .leftJoin(services, eq(bookings.serviceId, services.id))
      .where(and(eq(payments.vendorId, access.vendorId), eq(payments.status, "paid")))
      .orderBy(desc(payments.paidAt))
      .limit(50),
    db.select().from(vendorPayouts).where(eq(vendorPayouts.vendorId, access.vendorId)).orderBy(desc(vendorPayouts.requestedAt)),
  ]);
  return { access, balance, recent, payouts };
}

export async function getAdminPayouts() {
  await requireAdmin();
  const db = getDb();
  const [allVendors, requests, refunds, bookingRefunds] = await Promise.all([
    db
      .select({ id: vendors.id, name: vendors.name, slug: vendors.slug, upiVpa: vendors.upiVpa, commissionBps: vendors.commissionBps })
      .from(vendors)
      .orderBy(vendors.name),
    db
      .select({ payout: vendorPayouts, vendorName: vendors.name, upiVpa: vendors.upiVpa })
      .from(vendorPayouts)
      .innerJoin(vendors, eq(vendorPayouts.vendorId, vendors.id))
      .orderBy(desc(vendorPayouts.requestedAt))
      .limit(100),
    db
      .select({ order: shopOrders, vendorName: vendors.name, payment: payments })
      .from(shopOrders)
      .innerJoin(vendors, eq(shopOrders.vendorId, vendors.id))
      .innerJoin(payments, and(eq(payments.shopOrderId, shopOrders.id), eq(payments.status, "paid")))
      .where(inArray(shopOrders.paymentStatus, ["refund_due"]))
      .orderBy(desc(shopOrders.updatedAt)),
    db
      .select({ booking: bookings, vendorName: vendors.name, payment: payments })
      .from(bookings)
      .innerJoin(vendors, eq(bookings.vendorId, vendors.id))
      .innerJoin(payments, and(eq(payments.bookingId, bookings.id), eq(payments.status, "paid")))
      .where(eq(bookings.paymentStatus, "refund_due"))
      .orderBy(desc(bookings.updatedAt)),
  ]);
  // Two queries for every vendor's balance instead of two per vendor.
  const [paid, payouts] = await balanceRows(db);
  const paidByVendor = groupByVendor(paid);
  const payoutsByVendor = groupByVendor(payouts);
  const balances = allVendors.map((v) => ({
    vendor: v,
    balance: toBalance(paidByVendor.get(v.id) ?? [], payoutsByVendor.get(v.id) ?? [], v.commissionBps),
  }));
  return { balances, requests, refunds, bookingRefunds };
}
