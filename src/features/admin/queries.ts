import "server-only";

import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { vendors } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";

export async function getAdminVendors() {
  await requireAdmin();
  const db = getDb();

  return db
    .select()
    .from(vendors)
    .orderBy(desc(vendors.createdAt));
}
