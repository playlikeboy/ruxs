import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { kidsChildren, kidsProviderProfiles, kidsSafetyConsents, vendors } from "@/db/schema";

export async function recordGuardianConsent(input: {
  guardianUserId: string;
  childId: string;
  consentType: "home_supervision" | "photo_waiver" | "emergency_medical" | "activity_participation";
  policyVersion?: string;
  ipAddress?: string;
}) {
  const db = getDb();

  // Validate child belongs to guardian
  const [child] = await db
    .select({ id: kidsChildren.id })
    .from(kidsChildren)
    .where(and(eq(kidsChildren.id, input.childId), eq(kidsChildren.guardianUserId, input.guardianUserId)))
    .limit(1);

  if (!child) {
    return { ok: false as const, error: "Child not found." };
  }

  const [consent] = await db
    .insert(kidsSafetyConsents)
    .values({
      guardianUserId: input.guardianUserId,
      childId: child.id,
      consentType: input.consentType,
      policyVersion: input.policyVersion || "2026-v1",
      ipAddress: input.ipAddress || null,
    })
    .returning({ id: kidsSafetyConsents.id, acceptedAt: kidsSafetyConsents.acceptedAt });

  return { ok: true as const, consentId: consent!.id };
}

export async function updateProviderVerification(input: {
  adminUserId: string;
  vendorId: string;
  verificationStatus: "pending" | "approved" | "rejected" | "suspended";
  safetyReviewStatus: "pending" | "passed" | "flagged";
  safetyNotes?: string;
}) {
  const db = getDb();

  const [vendor] = await db
    .select({ id: vendors.id })
    .from(vendors)
    .where(eq(vendors.id, input.vendorId))
    .limit(1);

  if (!vendor) {
    return { ok: false as const, error: "Vendor not found." };
  }

  await db
    .insert(kidsProviderProfiles)
    .values({
      vendorId: vendor.id,
      verificationStatus: input.verificationStatus,
      safetyReviewStatus: input.safetyReviewStatus,
      verifiedByAdminId: input.adminUserId,
      verifiedAt: input.verificationStatus === "approved" ? new Date() : null,
      safetyNotes: input.safetyNotes || null,
    })
    .onConflictDoUpdate({
      target: kidsProviderProfiles.vendorId,
      set: {
        verificationStatus: input.verificationStatus,
        safetyReviewStatus: input.safetyReviewStatus,
        verifiedByAdminId: input.adminUserId,
        verifiedAt: input.verificationStatus === "approved" ? new Date() : null,
        safetyNotes: input.safetyNotes || null,
        updatedAt: new Date(),
      },
    });

  return { ok: true as const };
}
