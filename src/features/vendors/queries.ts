import "server-only";
import { eq, and, gte, sql, or, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import {
  vendors,
  vendorMembers,
  vendorInvites,
  customers,
  subscriptions,
  orders,
  ledgerEntries,
  products,
} from "@/db/schema";
import { requireUser, requireVendorAccess } from "@/lib/auth/session";
import { todayIST } from "@/core/time";

/**
 * Returns all active vendors accessible by the currently signed-in user,
 * automatically accepting any pending email invites matching their verified primary email.
 */
export async function getVendorsForUser() {
  const user = await requireUser();
  const db = getDb();

  // Accept pending invites matching verified primary email
  if (user.primaryEmail && user.primaryEmailVerified) {
    const normalizedEmail = user.primaryEmail.toLowerCase();
    const pendingInvites = await db
      .select()
      .from(vendorInvites)
      .where(eq(vendorInvites.email, normalizedEmail));

    for (const inv of pendingInvites) {
      if (!inv.acceptedAt) {
        await db
          .insert(vendorMembers)
          .values({
            vendorId: inv.vendorId,
            userId: user.id,
            role: inv.role,
          })
          .onConflictDoNothing();

        await db
          .update(vendorInvites)
          .set({
            acceptedAt: new Date(),
            acceptedUserId: user.id,
          })
          .where(eq(vendorInvites.id, inv.id));
      }
    }
  }

  const rows = await db
    .select({
      vendor: vendors,
      role: vendorMembers.role,
    })
    .from(vendors)
    .innerJoin(vendorMembers, eq(vendorMembers.vendorId, vendors.id))
    .where(eq(vendorMembers.userId, user.id));

  return rows;
}

/**
 * Returns single vendor by slug with access verification.
 */
export async function getVendorBySlug(slug: string) {
  const access = await requireVendorAccess(slug);
  return access;
}

export async function getVendorAnalytics(slug: string) {
  const access = await requireVendorAccess(slug, ["owner", "staff"]);
  const db = getDb();
  const vendorId = access.vendorId;
  const today = todayIST();
  const currentMonthPrefix = today.slice(0, 7);
  const startOfMonth = `${currentMonthPrefix}-01`;

  // 1. Customer and subscription counts
  const [custCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(customers)
    .where(eq(customers.vendorId, vendorId));

  const [subCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.vendorId, vendorId),
        or(isNull(subscriptions.endsOn), gte(subscriptions.endsOn, today))
      )
    );

  // 2. Orders this month
  const monthOrders = await db
    .select({
      status: orders.status,
      qty: orders.qty,
      shift: orders.shift,
    })
    .from(orders)
    .where(
      and(
        eq(orders.vendorId, vendorId),
        gte(orders.serviceDate, startOfMonth)
      )
    );

  let deliveredCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  let deliveredUnits = 0;
  const shiftMap: Record<string, number> = {};

  for (const o of monthOrders) {
    if (o.status === "delivered") {
      deliveredCount++;
      deliveredUnits += o.qty;
    } else if (o.status === "skipped") {
      skippedCount++;
    } else if (o.status === "failed") {
      failedCount++;
    }
    shiftMap[o.shift] = (shiftMap[o.shift] || 0) + 1;
  }

  const totalOrders = monthOrders.length;
  const completionRate =
    totalOrders > 0 ? Math.round((deliveredCount / totalOrders) * 100) : 100;

  // 3. Financials from ledger
  const [billedRow] = await db
    .select({
      total: sql<number>`coalesce(sum(${ledgerEntries.amountPaise}), 0)::int`,
    })
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.vendorId, vendorId),
        sql`${ledgerEntries.type} in ('delivery', 'late_fee')`,
        gte(ledgerEntries.createdAt, new Date(`${startOfMonth}T00:00:00+05:30`))
      )
    );

  const [collectedRow] = await db
    .select({
      total: sql<number>`coalesce(sum(${ledgerEntries.amountPaise}), 0)::int`,
    })
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.vendorId, vendorId),
        eq(ledgerEntries.type, "payment"),
        gte(ledgerEntries.createdAt, new Date(`${startOfMonth}T00:00:00+05:30`))
      )
    );

  const [outstandingRow] = await db
    .select({
      total: sql<number>`coalesce(sum(${ledgerEntries.amountPaise}), 0)::int`,
    })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.vendorId, vendorId));

  // 4. Products overview
  const vendorProducts = await db
    .select()
    .from(products)
    .where(eq(products.vendorId, vendorId));

  return {
    vendor: access.vendor,
    role: access.role,
    totalCustomers: custCount?.count ?? 0,
    activeSubscriptions: subCount?.count ?? 0,
    totalOrdersThisMonth: totalOrders,
    deliveredOrders: deliveredCount,
    deliveredUnits,
    skippedOrders: skippedCount,
    failedOrders: failedCount,
    completionRate,
    billedPaiseThisMonth: billedRow?.total ?? 0,
    collectedPaiseThisMonth: Math.abs(collectedRow?.total ?? 0),
    outstandingBalancePaise: outstandingRow?.total ?? 0,
    shifts: shiftMap,
    products: vendorProducts,
  };
}

