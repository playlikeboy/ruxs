"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { customers, products, subscriptions } from "@/db/schema";
import { requireVendorAccess } from "@/lib/auth/session";
import { saveSubscriptionSchema } from "./schemas";

export async function saveSubscription(input: unknown) {
  const parsed = saveSubscriptionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { slug, id, customerId, productId, qty, days, startsOn, endsOn } = parsed.data;
  const access = await requireVendorAccess(slug, ["owner", "staff"]);
  const db = getDb();

  // Client-provided IDs must both belong to the authenticated vendor.
  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.vendorId, access.vendorId)))
    .limit(1);

  if (!customer) {
    return { ok: false, error: "Customer not found in this business" };
  }

  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.vendorId, access.vendorId)))
    .limit(1);

  if (!product) {
    return { ok: false, error: "Product not found in this business" };
  }

  try {
    if (id) {
      const [updated] = await db
        .update(subscriptions)
        .set({
          productId,
          qty,
          days,
          startsOn,
          endsOn: endsOn || null,
        })
        .where(
          and(
            eq(subscriptions.id, id),
            eq(subscriptions.vendorId, access.vendorId),
            eq(subscriptions.customerId, customerId)
          )
        )
        .returning({ id: subscriptions.id });

      if (!updated) {
        return { ok: false, error: "Subscription not found in this business" };
      }
    } else {
      await db.insert(subscriptions).values({
        vendorId: access.vendorId,
        customerId,
        productId,
        qty,
        days,
        startsOn,
        endsOn: endsOn || null,
      });
    }

    revalidatePath("/merchant-panel/" + slug + "/customers/" + customerId);
    revalidatePath("/merchant-panel/" + slug + "/products");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save the subscription. Check the details and try again." };
  }
}
