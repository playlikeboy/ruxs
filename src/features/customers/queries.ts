import "server-only";
import { eq, desc } from "drizzle-orm";
import { getDb } from "@/db";
import {
  customers,
  subscriptions,
  products,
  ledgerEntries,
  assetMovements,
} from "@/db/schema";
import { requireVendorAccess } from "@/lib/auth/session";
import { balance } from "@/core/ledger";
import { canBalance } from "@/core/assets";

export async function getCustomersForVendor(slug: string) {
  const access = await requireVendorAccess(slug);
  const db = getDb();

  const custList = await db
    .select()
    .from(customers)
    .where(eq(customers.vendorId, access.vendorId))
    .orderBy(customers.society, customers.tower, customers.flat);

  // Compute balance per customer
  const ledgerRows = await db
    .select({
      customerId: ledgerEntries.customerId,
      amountPaise: ledgerEntries.amountPaise,
    })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.vendorId, access.vendorId));

  const balanceByCustomer = new Map<string, number>();
  for (const entry of ledgerRows) {
    const prev = balanceByCustomer.get(entry.customerId) ?? 0;
    balanceByCustomer.set(entry.customerId, prev + entry.amountPaise);
  }

  return custList.map((c) => ({
    ...c,
    balancePaise: balanceByCustomer.get(c.id) ?? 0,
  }));
}

export async function getCustomerDetails(slug: string, customerId: string) {
  const access = await requireVendorAccess(slug);
  const db = getDb();

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);

  if (!customer || customer.vendorId !== access.vendorId) {
    return null;
  }

  // Get active subscriptions
  const subs = await db
    .select({
      sub: subscriptions,
      product: products,
    })
    .from(subscriptions)
    .innerJoin(products, eq(subscriptions.productId, products.id))
    .where(eq(subscriptions.customerId, customer.id));

  // Get ledger timeline (newest first)
  const ledger = await db
    .select()
    .from(ledgerEntries)
    .where(eq(ledgerEntries.customerId, customer.id))
    .orderBy(desc(ledgerEntries.createdAt));

  // Get assets
  const movements = await db
    .select()
    .from(assetMovements)
    .where(eq(assetMovements.customerId, customer.id));

  return {
    customer,
    subscriptions: subs,
    ledger,
    balancePaise: balance(ledger),
    canHoldings: canBalance(movements),
  };
}
