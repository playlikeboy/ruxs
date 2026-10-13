"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { subscriptions } from "@/db/schema";
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

  try {
    if (id) {
      await db
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
        );
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

    revalidatePath(`/app/${slug}/customers/${customerId}`);
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Database error";
    return { ok: false, error: msg };
  }
}
