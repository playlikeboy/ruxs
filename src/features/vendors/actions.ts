"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { vendors, vendorInvites } from "@/db/schema";
import { requireVendorAccess } from "@/lib/auth/session";
import { inviteStaffSchema, storefrontSchema } from "./schemas";
import { rupeesToPaise } from "@/core/money";

export async function inviteStaff(input: unknown) {
  const parsed = inviteStaffSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { slug, email, role } = parsed.data;
  const access = await requireVendorAccess(slug, ["owner"]);
  const db = getDb();
  const normalizedEmail = email.toLowerCase().trim();

  try {
    await db
      .insert(vendorInvites)
      .values({
        vendorId: access.vendorId,
        email: normalizedEmail,
        role,
        createdBy: access.user.id,
      })
      .onConflictDoNothing();

    revalidatePath(`/merchant-panel/${slug}/settings`);
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Database error";
    return { ok: false, error: message };
  }
}

export async function saveStorefront(input: unknown) {
  const parsed = storefrontSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { slug, ...data } = parsed.data;
  const access = await requireVendorAccess(slug, ["owner"]);
  const db = getDb();

  await db
    .update(vendors)
    .set({
      name: data.name,
      phone: data.phone,
      upiVpa: data.upiVpa,
      area: data.area,
      city: data.city,
      mapsUrl: data.mapsUrl || null,
      description: data.description || null,
      coverUrl: data.coverUrl || null,
      latitude: data.latitude,
      longitude: data.longitude,
      serviceRadiusKm: data.serviceRadiusKm,
      deliveryFeePaise: rupeesToPaise(data.deliveryFeeRupees),
      minOrderPaise: rupeesToPaise(data.minOrderRupees),
      acceptingOrders: data.acceptingOrders,
      gstBps: data.gstBps,
      pricesIncludeGst: data.pricesIncludeGst,
      discountBps: Math.round(data.discountPercent * 100),
      updatedAt: new Date(),
    })
    .where(eq(vendors.id, access.vendorId));

  revalidatePath(`/merchant-panel/${slug}`, "layout");
  revalidatePath("/app", "layout");
  revalidatePath("/admin", "layout");
  return { ok: true };
}
