import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, vendorApplications } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";

export type ApplicationStatus = "new" | "contacted" | "approved" | "rejected";

export async function getApplications(filter: { status?: ApplicationStatus; categoryId?: string }) {
  await requireAdmin();
  const db = getDb();
  const where = and(
    filter.status ? eq(vendorApplications.status, filter.status) : undefined,
    filter.categoryId ? eq(vendorApplications.categoryId, filter.categoryId) : undefined
  );
  const [rows, counts] = await Promise.all([
    db
      .select({ app: vendorApplications, categoryLabel: categories.label })
      .from(vendorApplications)
      .leftJoin(categories, eq(vendorApplications.categoryId, categories.id))
      .where(where)
      .orderBy(desc(vendorApplications.createdAt))
      .limit(200),
    db.select({ status: vendorApplications.status, n: sql<number>`count(*)::int` }).from(vendorApplications).groupBy(vendorApplications.status),
  ]);
  return { rows, counts: Object.fromEntries(counts.map((c) => [c.status, c.n])) as Partial<Record<ApplicationStatus, number>> };
}

export async function getApplication(id: string) {
  await requireAdmin();
  const [row] = await getDb().select().from(vendorApplications).where(eq(vendorApplications.id, id)).limit(1);
  return row ?? null;
}

export async function countNewApplications() {
  const [row] = await getDb().select({ n: sql<number>`count(*)::int` }).from(vendorApplications).where(eq(vendorApplications.status, "new"));
  return row?.n ?? 0;
}
