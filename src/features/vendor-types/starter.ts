import { eq } from "drizzle-orm";
import type { getDb } from "@/db";
import { kidsCategories, kidsServices, products, services } from "@/db/schema";
import { defaultKidsCategory } from "@/core/kids/category-for-type";
import { starterCatalog } from "@/core/starter-catalog";
import { allowedCategoryIds, type VendorType } from "@/core/vendor-types";
import { hasItemTable, provisionItemDetails } from "./tables";

// No "server-only" here: the backfill script reuses it.
type Db = ReturnType<typeof getDb>;
type Executor = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** Adds the type's conventional first menu. Returns how many items it added. */
export async function seedStarterCatalog(db: Executor, vendor: { id: string; vendorType: VendorType; categoryId: string | null }): Promise<number> {
  const catalog = starterCatalog(vendor.vendorType);
  if (!catalog) return 0;
  const categoryId = allowedCategoryIds(vendor.vendorType, vendor.categoryId)[0]!;

  if (catalog.kind === "products") {
    const rows = await db
      .insert(products)
      .values(
        catalog.items.map((p) => ({
          vendorId: vendor.id,
          kind: categoryId,
          name: p.name,
          description: p.description,
          section: p.section,
          shift: p.shift,
          pricePaise: p.pricePaise,
          depositPaise: p.depositPaise ?? 0,
          assetName: p.assetName ?? null,
          cutoffAt: p.cutoffAt,
          isVeg: p.isVeg ?? null,
          allowSubscription: p.allowSubscription ?? true,
        }))
      )
      .returning({ id: products.id });
    if (hasItemTable(vendor.vendorType)) for (const r of rows) await provisionItemDetails(db, vendor.id, vendor.vendorType, r.id);
    return rows.length;
  }

  if (catalog.kind === "services") {
    const rows = await db
      .insert(services)
      .values(catalog.items.map((s, i) => ({ vendorId: vendor.id, categoryId, name: s.name, description: s.description, durationMinutes: s.durationMinutes, pricePaise: s.pricePaise, modes: s.modes, sort: i })))
      .returning({ id: services.id });
    if (hasItemTable(vendor.vendorType)) for (const r of rows) await provisionItemDetails(db, vendor.id, vendor.vendorType, r.id);
    return rows.length;
  }

  const list = await db.select({ id: kidsCategories.id }).from(kidsCategories).where(eq(kidsCategories.isActive, true));
  const kidsCategoryId = defaultKidsCategory(vendor.vendorType, list);
  if (!kidsCategoryId) return 0;
  const rows = await db
    .insert(kidsServices)
    .values(
      catalog.items.map((k) => ({
        vendorId: vendor.id,
        categoryId: kidsCategoryId,
        title: k.title,
        slug: `${slugify(k.title)}-${crypto.randomUUID().slice(0, 4)}`,
        description: k.description,
        minAge: k.minAge,
        maxAge: k.maxAge,
        durationMinutes: k.durationMinutes,
        deliveryModes: k.deliveryModes,
        pricePaise: k.pricePaise,
      }))
    )
    .returning({ id: kidsServices.id });
  return rows.length;
}
