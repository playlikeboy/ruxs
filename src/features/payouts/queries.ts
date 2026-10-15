import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { customers, payments, shopOrders, vendorPayouts, vendors } from "@/db/schema";
import { requireAdmin, requireVendorAccess } from "@/lib/auth/session";
import { paymentState, vendorBalance, type BalancePayout } from "@/core/payouts";

/** Balance for one vendor. No auth check: callers must have checked access. */
export async function computeVendorBalance(vendorId: string, commissionBps: number) {
  const db = getDb();
  const [paid, payouts] = await Promise.all([
    db
      .select({ amountPaise: payments.amountPaise, purpose: payments.purpose, orderStatus: shopOrders.status })
      .from(payments)
      .leftJoin(shopOrders, eq(payments.shopOrderId, shopOrders.id))
      .where(and(eq(payments.vendorId, vendorId), eq(payments.status, "paid"))),
    db
      .select({ amountPaise: vendorPayouts.amountPaise, status: vendorPayouts.status })
      .from(vendorPayouts)
      .where(eq(vendorPayouts.vendorId, vendorId)),
  ]);
  return vendorBalance(
    paid.map((p) => ({ amountPaise: p.amountPaise, state: paymentState(p.purpose as "shop_order" | "dues", p.orderStatus) })),
    payouts as BalancePayout[],
    commissionBps
  );
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
      })
      .from(payments)
      .innerJoin(customers, eq(payments.customerId, customers.id))
      .leftJoin(shopOrders, eq(payments.shopOrderId, shopOrders.id))
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
  const [allVendors, requests, refunds] = await Promise.all([
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
  ]);
  const balances = await Promise.all(
    allVendors.map(async (v) => ({ vendor: v, balance: await computeVendorBalance(v.id, v.commissionBps) }))
  );
  return { balances, requests, refunds };
}
