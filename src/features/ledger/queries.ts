import "server-only";

import { eq, and, desc } from "drizzle-orm";
import { getDb } from "@/db";
import { ledgerEntries } from "@/db/schema";
import { requireVendorAccess } from "@/lib/auth/session";
import { balance } from "@/core/ledger";

export async function getCustomerLedger(slug: string, customerId: string) {
  const access = await requireVendorAccess(slug, ["owner", "staff", "driver"]);
  const db = getDb();

  const entries = await db
    .select()
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.vendorId, access.vendorId),
        eq(ledgerEntries.customerId, customerId)
      )
    )
    .orderBy(desc(ledgerEntries.createdAt));

  const currentBalancePaise = balance(entries);

  return {
    entries,
    currentBalancePaise,
  };
}

export async function getCustomerBalance(slug: string, customerId: string) {
  const access = await requireVendorAccess(slug, ["owner", "staff", "driver"]);
  const db = getDb();

  const entries = await db
    .select({ amountPaise: ledgerEntries.amountPaise })
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.vendorId, access.vendorId),
        eq(ledgerEntries.customerId, customerId)
      )
    );

  return balance(entries);
}
