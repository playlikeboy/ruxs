"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { products } from "@/db/schema";
import { requireVendorAccess } from "@/lib/auth/session";
import { rupeesToPaise } from "@/core/money";
import { saveProductSchema } from "./schemas";

export async function saveProduct(input: unknown) {
  const parsed = saveProductSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { slug, id, ...data } = parsed.data;
  const access = await requireVendorAccess(slug, ["owner"]);
  const db = getDb();

  const pricePaise = rupeesToPaise(data.priceRupees);
  const depositPaise = rupeesToPaise(data.depositRupees);

  try {
    if (id) {
      // Update existing product
      await db
        .update(products)
        .set({
          name: data.name,
          shift: data.shift,
          pricePaise,
          depositPaise,
          assetName: data.assetName || null,
          pollAt: data.pollAt || null,
          cutoffAt: data.cutoffAt,
          lateRule: data.lateRule,
        })
        .where(
          and(eq(products.id, id), eq(products.vendorId, access.vendorId))
        );
    } else {
      // Create new product
      await db.insert(products).values({
        vendorId: access.vendorId,
        kind: data.kind,
        name: data.name,
        shift: data.shift,
        pricePaise,
        depositPaise,
        assetName: data.assetName || null,
        pollAt: data.pollAt || null,
        cutoffAt: data.cutoffAt,
        lateRule: data.lateRule,
      });
    }

    revalidatePath(`/app/${slug}/products`);
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Database error";
    return { ok: false, error: message };
  }
}
