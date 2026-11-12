import "server-only";
import { and, eq, desc } from "drizzle-orm";
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

  const [custList, ledgerRows] = await Promise.all([
    db
      .select()
      .from(customers)
      .where(eq(customers.vendorId, access.vendorId))
      .orderBy(customers.society, customers.tower, customers.flat),
    // Balance per customer is summed from the vendor's ledger below.
    db
      .select({
        customerId: ledgerEntries.customerId,
        amountPaise: ledgerEntries.amountPaise,
      })
      .from(ledgerEntries)
      .where(eq(ledgerEntries.vendorId, access.vendorId)),
  ]);

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
  const access = await requireVendorAccess(slug, ["owner", "staff"]);
  const db = getDb();

  const [customer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.vendorId, access.vendorId)))
    .limit(1);

  if (!customer) {
    return null;
  }

  // Plans, ledger timeline (newest first) and can movements are independent reads.
  const [subs, ledger, movements] = await Promise.all([
    db
      .select({
        sub: subscriptions,
        product: products,
      })
      .from(subscriptions)
      .innerJoin(products, eq(subscriptions.productId, products.id))
      .where(eq(subscriptions.customerId, customer.id)),
    db
      .select()
      .from(ledgerEntries)
      .where(eq(ledgerEntries.customerId, customer.id))
      .orderBy(desc(ledgerEntries.createdAt)),
    db
      .select()
      .from(assetMovements)
      .where(eq(assetMovements.customerId, customer.id)),
  ]);

  return {
    customer,
    subscriptions: subs,
    ledger,
    balancePaise: balance(ledger),
    canHoldings: canBalance(movements),
  };
}
