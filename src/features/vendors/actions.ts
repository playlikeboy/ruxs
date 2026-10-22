"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, vendors, vendorMembers, vendorInvites } from "@/db/schema";
import { VENDOR_TYPE_INFO, isVendorType, vendorTypeForCategory } from "@/core/vendor-types";
import { provisionTypeProfile } from "@/features/vendor-types/tables";
import { requireUser, requireVendorAccess } from "@/lib/auth/session";
import { createVendorSchema, inviteStaffSchema, storefrontSchema } from "./schemas";
import { rupeesToPaise } from "@/core/money";

export async function createVendor(input: unknown) {
  const user = await requireUser();
  const parsed = createVendorSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const db = getDb();
  const data = parsed.data;

  // Check unique slug
  const [existing] = await db
    .select({ id: vendors.id })
    .from(vendors)
    .where(eq(vendors.slug, data.slug))
    .limit(1);

  if (existing) {
    return { ok: false, error: "That vendor URL slug is already taken" };
  }

  const [category] = await db
    .select({ fulfilment: categories.fulfilment, vendorType: categories.vendorType })
    .from(categories)
    .where(eq(categories.id, data.categoryId))
    .limit(1);
  const vendorType = category && isVendorType(category.vendorType)
    ? category.vendorType
    : vendorTypeForCategory(data.categoryId);

  try {
    const newVendor = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(vendors)
        .values({
          name: data.name,
          slug: data.slug,
          phone: data.phone,
          upiVpa: data.upiVpa,
          city: data.city,
          area: data.area,
          latitude: data.latitude,
          longitude: data.longitude,
          categoryId: data.categoryId,
          vendorType,
          businessType: VENDOR_TYPE_INFO[vendorType].fulfilment,
          plan: "free",
          status: "pending", // New vendors start pending admin approval
        })
        .returning();
      if (!row) throw new Error("Could not create vendor record");
      await provisionTypeProfile(tx, row.id, vendorType);
      // Assign creating user as owner
      await tx.insert(vendorMembers).values({ vendorId: row.id, userId: user.id, role: "owner" });
      return row;
    });

    revalidatePath("/merchant-panel");
    return { ok: true, slug: newVendor.slug };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Database error";
    return { ok: false, error: message };
  }
}

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
      updatedAt: new Date(),
    })
    .where(eq(vendors.id, access.vendorId));

  revalidatePath(`/merchant-panel/${slug}`, "layout");
  revalidatePath("/app", "layout");
  revalidatePath("/admin", "layout");
  return { ok: true };
}
