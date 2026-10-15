"use server";

import { revalidatePath } from "next/cache";
import { eq, and, isNull, or, gte } from "drizzle-orm";
import { getDb } from "@/db";
import { products, subscriptions } from "@/db/schema";
import { requireVendorAccess } from "@/lib/auth/session";
import { rupeesToPaise } from "@/core/money";
import { todayIST } from "@/core/time";
import { productIdSchema, saveProductSchema, toggleAvailabilitySchema } from "./schemas";

function revalidateMenu(slug: string) {
  revalidatePath(`/merchant-panel/${slug}/products`);
  revalidatePath(`/app/store/${slug}`);
}

export async function saveProduct(input: unknown) {
  const parsed = saveProductSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { slug, id, ...data } = parsed.data;
  const access = await requireVendorAccess(slug, ["owner"]);
  const db = getDb();

  const values = {
    name: data.name,
    description: data.description || null,
    section: data.section || null,
    imageUrl: data.imageUrl || null,
    isVeg: data.isVeg,
    shift: data.shift,
    pricePaise: rupeesToPaise(data.priceRupees),
    depositPaise: rupeesToPaise(data.depositRupees),
    assetName: data.assetName || null,
    pollAt: data.pollAt || null,
    cutoffAt: data.cutoffAt,
    lateRule: data.lateRule,
    isAvailable: data.isAvailable,
    allowSubscription: data.allowSubscription,
    allowOneTime: data.allowOneTime,
  };

  try {
    if (id) {
      const [updated] = await db
        .update(products)
        .set({ ...values, kind: data.kind })
        .where(and(eq(products.id, id), eq(products.vendorId, access.vendorId), isNull(products.archivedAt)))
        .returning({ id: products.id });
      if (!updated) return { ok: false, error: "Item not found" };
    } else {
      await db.insert(products).values({ ...values, vendorId: access.vendorId, kind: data.kind });
    }

    revalidateMenu(slug);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save the item. Check the details and try again." };
  }
}

export async function setProductAvailability(input: unknown) {
  const parsed = toggleAvailabilitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const { slug, id, isAvailable } = parsed.data;
  const access = await requireVendorAccess(slug, ["owner", "staff"]);
  const db = getDb();
  await db
    .update(products)
    .set({ isAvailable })
    .where(and(eq(products.id, id), eq(products.vendorId, access.vendorId)));

  revalidateMenu(slug);
  return { ok: true };
}

/** Removes an item from the menu. Past orders keep pointing at it, so it is archived, not deleted. */
export async function archiveProduct(input: unknown) {
  const parsed = productIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const { slug, id } = parsed.data;
  const access = await requireVendorAccess(slug, ["owner"]);
  const db = getDb();

  const [active] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.productId, id),
        eq(subscriptions.vendorId, access.vendorId),
        or(isNull(subscriptions.endsOn), gte(subscriptions.endsOn, todayIST()))
      )
    )
    .limit(1);
  if (active) {
    return {
      ok: false,
      error: "Households are still subscribed to this item. Mark it unavailable, or end those plans first.",
    };
  }

  await db
    .update(products)
    .set({ archivedAt: new Date(), isAvailable: false })
    .where(and(eq(products.id, id), eq(products.vendorId, access.vendorId)));

  revalidateMenu(slug);
  return { ok: true };
}
