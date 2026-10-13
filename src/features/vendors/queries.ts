import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { vendors, vendorMembers, vendorInvites } from "@/db/schema";
import { requireUser, requireVendorAccess } from "@/lib/auth/session";

/**
 * Returns all active vendors accessible by the currently signed-in user,
 * automatically accepting any pending email invites matching their verified primary email.
 */
export async function getVendorsForUser() {
  const user = await requireUser();
  const db = getDb();

  // Accept pending invites matching verified primary email
  if (user.primaryEmail && user.primaryEmailVerified) {
    const normalizedEmail = user.primaryEmail.toLowerCase();
    const pendingInvites = await db
      .select()
      .from(vendorInvites)
      .where(eq(vendorInvites.email, normalizedEmail));

    for (const inv of pendingInvites) {
      if (!inv.acceptedAt) {
        await db
          .insert(vendorMembers)
          .values({
            vendorId: inv.vendorId,
            userId: user.id,
            role: inv.role,
          })
          .onConflictDoNothing();

        await db
          .update(vendorInvites)
          .set({
            acceptedAt: new Date(),
            acceptedUserId: user.id,
          })
          .where(eq(vendorInvites.id, inv.id));
      }
    }
  }

  const rows = await db
    .select({
      vendor: vendors,
      role: vendorMembers.role,
    })
    .from(vendors)
    .innerJoin(vendorMembers, eq(vendorMembers.vendorId, vendors.id))
    .where(eq(vendorMembers.userId, user.id));

  return rows;
}

/**
 * Returns single vendor by slug with access verification.
 */
export async function getVendorBySlug(slug: string) {
  const access = await requireVendorAccess(slug);
  return access;
}
