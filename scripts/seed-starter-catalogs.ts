/**
 * Gives every existing vendor with an empty menu the starter catalogue new
 * vendors get on creation, and gives booking vendors without hours the
 * default Mon–Sat 10:00–19:00 week. Additive only; safe to re-run.
 *
 *   bun --env-file=.env.local scripts/seed-starter-catalogs.ts          # dry run
 *   bun --env-file=.env.local scripts/seed-starter-catalogs.ts --yes    # writes
 */
import { and, count, eq, isNull } from "drizzle-orm";
import { scriptDb, scriptPool } from "../src/db/script-client";
import { availabilityRules, kidsServices, products, services, vendors } from "../src/db/schema";
import { starterCatalog } from "../src/core/starter-catalog";
import { VENDOR_TYPE_INFO, toVendorType } from "../src/core/vendor-types";
import { seedStarterCatalog } from "../src/features/vendor-types/starter";

const execute = process.argv.includes("--yes");
const DEFAULT_WEEK = ["mon", "tue", "wed", "thu", "fri", "sat"] as const;

const all = await scriptDb.select({ id: vendors.id, slug: vendors.slug, vendorType: vendors.vendorType, businessType: vendors.businessType, categoryId: vendors.categoryId }).from(vendors);
for (const v of all) {
  const type = toVendorType(v.vendorType, v.businessType);
  const kind = starterCatalog(type)?.kind;
  const table = kind === "products" ? products : kind === "services" ? services : kidsServices;
  const [{ n }] = await scriptDb.select({ n: count() }).from(table).where(and(eq(table.vendorId, v.id), isNull(table.archivedAt))) as [{ n: number }];
  const [{ hours }] = await scriptDb.select({ hours: count() }).from(availabilityRules).where(eq(availabilityRules.vendorId, v.id)) as [{ hours: number }];
  const needsHours = VENDOR_TYPE_INFO[type].fulfilment === "booking" && hours === 0;
  if (n > 0 && !needsHours) continue;
  console.log(`${v.slug} (${type}): ${n === 0 ? "add starter menu" : ""}${n === 0 && needsHours ? " + " : ""}${needsHours ? "add default hours" : ""}`);
  if (!execute) continue;
  await scriptDb.transaction(async (tx) => {
    if (n === 0) await seedStarterCatalog(tx, { id: v.id, vendorType: type, categoryId: v.categoryId });
    if (needsHours) await tx.insert(availabilityRules).values(DEFAULT_WEEK.map((weekday) => ({ vendorId: v.id, weekday, startTime: "10:00", endTime: "19:00" })));
  });
}
console.log(execute ? "Done." : "Dry run. Re-run with --yes to write.");
await scriptPool.end();
