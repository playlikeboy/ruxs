import "server-only";
import { asc, eq, inArray } from "drizzle-orm";
import { storeCategories, storeProducts, storeStockMovements } from "@/db/schema";
import { cameBackInStock, storeSlug } from "@/core/store";
import { writeStoreAudit } from "./audit";
import { parseProductImportCsv, parseStockCsv, type CsvRowError } from "./csv";
import { storeProductSchema } from "./schemas";
import { isUniqueViolation, type StoreDb } from "./settings";
import { queueBackInStock } from "./stock-alerts";
import type { StoreBulkStockResult, StoreImportResult } from "./types";

/**
 * Bulk catalog tools for the seller portal: product import from CSV (upsert by
 * SKU) and bulk stock update. No auth here: callers guard.
 */

type ProductRow = typeof storeProducts.$inferSelect;

/**
 * Imports products from CSV text. Rows are matched by SKU: a known SKU is
 * updated (blank cells keep the saved value; the stock column is ignored, use
 * the stock update for that), a new SKU is created (inactive unless the row
 * says active = yes) with the stock column as opening stock.
 * Rows that fail validation are reported and skipped; the rest are written in
 * one transaction. With `dryRun` nothing is written.
 */
export async function importStoreProductsCore(db: StoreDb, input: { csv: string; dryRun?: boolean; actorId: string; now?: Date }): Promise<StoreImportResult> {
  const now = input.now ?? new Date();
  const parsed = parseProductImportCsv(input.csv);
  if (parsed.fatal) return { dryRun: true, totalRows: 0, created: 0, updated: 0, errors: [{ line: 1, sku: null, message: parsed.fatal }] };
  const errors: CsvRowError[] = [...parsed.errors];
  const totalRows = parsed.rows.length + parsed.errors.length;

  const skus = parsed.rows.map((r) => r.sku);
  const [existingRows, categories, slugRows] = await Promise.all([
    skus.length ? db.select().from(storeProducts).where(inArray(storeProducts.sku, skus)) : Promise.resolve([] as ProductRow[]),
    db.select({ id: storeCategories.id }).from(storeCategories),
    db.select({ id: storeProducts.id, slug: storeProducts.slug }).from(storeProducts),
  ]);
  const bySku = new Map(existingRows.map((p) => [p.sku, p]));
  const categoryIds = new Set(categories.map((c) => c.id));
  const slugOwner = new Map(slugRows.map((s) => [s.slug, s.id]));

  type Planned = { line: number; sku: string; existing: ProductRow | null; data: ReturnType<typeof storeProductSchema.parse>; slug: string };
  const planned: Planned[] = [];
  for (const row of parsed.rows) {
    const fail = (message: string) => errors.push({ line: row.line, sku: row.sku, message });
    const existing = bySku.get(row.sku) ?? null;
    const f = row.fields;
    if (!existing) {
      const missing = [!f.name && "name", !f.categoryId && "category", f.pricePaise == null && "price"].filter(Boolean);
      if (missing.length) {
        fail(`New product: add ${missing.join(", ")}`);
        continue;
      }
    }
    const categoryId = f.categoryId ?? existing?.categoryId ?? "";
    if (!categoryIds.has(categoryId)) {
      fail(`Unknown category "${categoryId}". Use the category id (slug).`);
      continue;
    }
    const candidate = {
      name: f.name ?? existing?.name ?? "",
      slug: f.slug ?? existing?.slug ?? "",
      categoryId,
      tagline: f.tagline ?? existing?.tagline ?? "",
      description: f.description ?? existing?.description ?? "",
      brand: f.brand ?? existing?.brand ?? "",
      sku: row.sku,
      pricePaise: f.pricePaise ?? existing?.pricePaise ?? 0,
      mrpPaise: f.mrpPaise !== undefined ? f.mrpPaise : (existing?.mrpPaise ?? null),
      gstBps: f.gstBps ?? existing?.gstBps ?? 1800,
      lowStockAt: f.lowStockAt ?? existing?.lowStockAt ?? 5,
      ageMin: f.ageMin ?? existing?.ageMin ?? 0,
      ageMax: f.ageMax !== undefined ? f.ageMax : (existing?.ageMax ?? null),
      skills: f.skills ?? existing?.skills ?? [],
      boxContents: f.boxContents ?? existing?.boxContents ?? [],
      safetyNotes: f.safetyNotes ?? existing?.safetyNotes ?? "",
      images: f.images ?? existing?.images ?? [],
      weightGrams: f.weightGrams !== undefined ? f.weightGrams : (existing?.weightGrams ?? null),
      isFeatured: f.isFeatured ?? existing?.isFeatured ?? false,
      // New products start hidden so an admin can check them before they go live.
      isActive: f.isActive ?? existing?.isActive ?? false,
      initialStock: existing ? 0 : (f.stock ?? 0),
    };
    const checked = storeProductSchema.safeParse(candidate);
    if (!checked.success) {
      const issue = checked.error.issues[0];
      fail(issue ? `${issue.path.join(".") || "row"}: ${issue.message}` : "Invalid row");
      continue;
    }
    const slug = checked.data.slug || storeSlug(checked.data.name);
    if (!slug) {
      fail("Add a name with letters or numbers");
      continue;
    }
    const owner = slugOwner.get(slug);
    if (owner !== undefined && owner !== (existing?.id ?? null)) {
      fail(`Another product already uses the slug "${slug}". Add a slug column with a different value.`);
      continue;
    }
    slugOwner.set(slug, existing?.id ?? `new:${row.sku}`);
    planned.push({ line: row.line, sku: row.sku, existing, data: checked.data, slug });
  }

  errors.sort((a, b) => a.line - b.line);
  const created = planned.filter((p) => !p.existing).length;
  const updated = planned.length - created;
  if (input.dryRun || planned.length === 0) return { dryRun: true, totalRows, created, updated, errors };

  try {
    await db.transaction(async (tx) => {
      for (const p of planned) {
        const { id: _id, slug: _slug, initialStock, ...data } = p.data;
        if (p.existing) {
          await tx
            .update(storeProducts)
            .set({ ...data, slug: p.slug, updatedAt: now })
            .where(eq(storeProducts.id, p.existing.id));
        } else {
          const [row] = await tx
            .insert(storeProducts)
            .values({ ...data, slug: p.slug, stock: initialStock, createdAt: now, updatedAt: now })
            .returning({ id: storeProducts.id });
          if (initialStock > 0) {
            await tx.insert(storeStockMovements).values({
              productId: row!.id,
              delta: initialStock,
              stockAfter: initialStock,
              reason: "restock",
              actor: input.actorId,
              note: "Opening stock (CSV import)",
              createdAt: now,
            });
          }
        }
      }
      await writeStoreAudit(
        tx,
        { actorUserId: input.actorId, action: "product.import", entity: "product", data: { created, updated, skipped: errors.length, skus: planned.slice(0, 100).map((p) => p.sku) } },
        { strict: true }
      );
    });
  } catch (err) {
    console.error("[store] product import failed", err instanceof Error ? err.message : err);
    const message = isUniqueViolation(err) ? "A slug or SKU in this file is already used by another product. Nothing was imported." : "Could not import the products. Nothing was imported.";
    return { dryRun: true, totalRows, created: 0, updated: 0, errors: [{ line: 1, sku: null, message }, ...errors] };
  }
  return { dryRun: false, totalRows, created, updated, errors };
}

/**
 * Sets ("set") or changes ("add") the stock of many products by SKU in one
 * transaction, with a stock movement per changed product. Unknown SKUs and
 * rows that would go below zero are reported and skipped.
 */
export async function bulkUpdateStockCore(
  db: StoreDb,
  input: { mode: "set" | "add"; rows?: { sku: string; qty: number }[]; csv?: string; note?: string | null; actorId: string; now?: Date }
): Promise<StoreBulkStockResult> {
  const now = input.now ?? new Date();
  const errors: CsvRowError[] = [];
  let rows: { line: number; sku: string; qty: number }[];
  if (input.rows && input.rows.length > 0) {
    const seen = new Set<string>();
    rows = [];
    input.rows.forEach((r, i) => {
      const sku = r.sku.trim().toUpperCase();
      if (seen.has(sku)) errors.push({ line: i + 1, sku, message: "This SKU appears more than once" });
      else rows.push({ line: i + 1, sku, qty: r.qty });
      seen.add(sku);
    });
  } else {
    const parsed = parseStockCsv(input.csv ?? "");
    if (parsed.fatal) return { updated: 0, unchanged: 0, errors: [{ line: 1, sku: null, message: parsed.fatal }] };
    rows = parsed.rows;
    errors.push(...parsed.errors);
  }
  if (rows.length === 0) return { updated: 0, unchanged: 0, errors };

  let updated = 0;
  let unchanged = 0;
  const backInStock: string[] = [];
  try {
    await db.transaction(async (tx) => {
      // Lock in id order, like order placement, so the two never deadlock.
      const products = await tx
        .select({ id: storeProducts.id, sku: storeProducts.sku, stock: storeProducts.stock })
        .from(storeProducts)
        .where(inArray(storeProducts.sku, rows.map((r) => r.sku)))
        .orderBy(asc(storeProducts.id))
        .for("update");
      const bySku = new Map(products.map((p) => [p.sku, p]));
      const changes: { sku: string; from: number; to: number }[] = [];
      for (const r of rows) {
        const p = bySku.get(r.sku);
        if (!p) {
          errors.push({ line: r.line, sku: r.sku, message: "No product has this SKU" });
          continue;
        }
        const target = input.mode === "set" ? r.qty : p.stock + r.qty;
        if (target < 0) {
          errors.push({ line: r.line, sku: r.sku, message: input.mode === "set" ? "Stock can't be negative" : `Only ${p.stock} in stock to remove` });
          continue;
        }
        const delta = target - p.stock;
        if (delta === 0) {
          unchanged++;
          continue;
        }
        await tx.update(storeProducts).set({ stock: target, updatedAt: now }).where(eq(storeProducts.id, p.id));
        await tx.insert(storeStockMovements).values({
          productId: p.id,
          delta,
          stockAfter: target,
          reason: input.mode === "add" && delta > 0 ? "restock" : "adjust",
          actor: input.actorId,
          note: input.note || "Bulk stock update",
          createdAt: now,
        });
        if (cameBackInStock(target, delta)) backInStock.push(p.id);
        changes.push({ sku: r.sku, from: p.stock, to: target });
        updated++;
      }
      if (updated > 0) {
        await writeStoreAudit(
          tx,
          { actorUserId: input.actorId, action: "stock.bulk_update", entity: "stock", data: { mode: input.mode, updated, changes: changes.slice(0, 200), note: input.note ?? null } },
          { strict: true }
        );
      }
    });
  } catch (err) {
    console.error("[store] bulk stock update failed", err instanceof Error ? err.message : err);
    return { updated: 0, unchanged: 0, errors: [{ line: 1, sku: null, message: "Could not update stock. Nothing was changed." }, ...errors] };
  }
  queueBackInStock(backInStock);
  errors.sort((a, b) => a.line - b.line);
  return { updated, unchanged, errors };
}
