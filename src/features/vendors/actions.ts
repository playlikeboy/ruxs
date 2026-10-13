"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { vendors, vendorMembers, vendorInvites } from "@/db/schema";
import { requireUser, requireVendorAccess } from "@/lib/auth/session";
import { createVendorSchema, inviteStaffSchema } from "./schemas";

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

  try {
    const [newVendor] = await db
      .insert(vendors)
      .values({
        name: data.name,
        slug: data.slug,
        phone: data.phone,
        upiVpa: data.upiVpa,
        city: data.city,
        area: data.area,
        plan: "free",
        status: "pending", // New vendors start pending admin approval
      })
      .returning();

    if (!newVendor) {
      return { ok: false, error: "Could not create vendor record" };
    }

    // Assign creating user as owner
    await db.insert(vendorMembers).values({
      vendorId: newVendor.id,
      userId: user.id,
      role: "owner",
    });

    revalidatePath("/app");
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

    revalidatePath(`/app/${slug}/settings`);
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Database error";
    return { ok: false, error: message };
  }
}
