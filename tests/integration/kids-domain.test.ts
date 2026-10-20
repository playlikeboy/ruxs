import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { eq } from "drizzle-orm";
import { scriptDb, scriptPool } from "@/db/script-client";
import {
  vendors,
  kidsServices,
  kidsChildren,
  kidsServiceBookings,
  kidsWorkshops,
  kidsWorkshopEnrollments,
  kidsHolidayPasses,
  kidsPassPurchases,
  kidsPassRedemptions,
} from "@/db/schema";
import { createKidsBooking } from "@/features/kids/booking-service";
import { enrollInWorkshop } from "@/features/kids/workshop-service";
import { purchaseHolidayPass, redeemPassCredit } from "@/features/kids/holiday-pass-service";

describe("Kids Activities & Learning Domain Integration Tests", () => {
  let dbAvailable = false;
  const ts = Date.now();
  const testVendorSlug = `test-kids-vendor-${ts}`;
  let vendorId: string;
  let serviceId: string;
  let workshopId: string;
  let passId: string;

  const guardian1 = `guardian-user-1-${ts}`;
  const guardian2 = `guardian-user-2-${ts}`;
  let child1Id: string;
  let child2Id: string;

  beforeAll(async () => {
    scriptPool.on("error", () => {});
    try {
      const client = await scriptPool.connect();
      client.release();
      dbAvailable = true;
    } catch {
      console.warn("Neon Database is not reachable from this environment; skipping DB tests.");
      return;
    }

    // 1. Create a test vendor
    const [v] = await scriptDb
      .insert(vendors)
      .values({
        slug: testVendorSlug,
        name: "Test STEM Academy",
        phone: "+919876543210",
        upiVpa: "stem@upi",
        city: "Ranchi",
        area: "Morabadi",
        status: "active",
      })
      .returning();
    vendorId = v!.id;

    // 2. Create test kids service
    const [svc] = await scriptDb
      .insert(kidsServices)
      .values({
        vendorId,
        categoryId: "stem",
        title: "Test LEGO Robotics",
        slug: `test-lego-${ts}`,
        minAge: 5,
        maxAge: 10,
        durationMinutes: 60,
        pricePaise: 50000,
        materialFeePolicy: "included",
        materialFeePaise: 0,
        deliveryModes: ["studio", "home"],
      })
      .returning();
    serviceId = svc!.id;

    // 3. Create test workshop with small capacity (capacity = 2)
    const [ws] = await scriptDb
      .insert(kidsWorkshops)
      .values({
        vendorId,
        categoryId: "stem",
        title: "Test Mini Mars Bootcamp",
        slug: `test-mini-mars-${ts}`,
        minAge: 6,
        maxAge: 12,
        startDate: "2026-11-01",
        endDate: "2026-11-02",
        enrollmentDeadline: new Date(Date.now() + 86400000 * 7),
        venueOrMode: "studio",
        capacity: 2,
        pricePaise: 80000,
        publicationState: "published",
      })
      .returning();
    workshopId = ws!.id;

    // 4. Create holiday pass definition
    passId = `test-pass-${ts}`;
    await scriptDb
      .insert(kidsHolidayPasses)
      .values({
        id: passId,
        name: "Test 2-Session Pass",
        eligibleScope: "all",
        creditsTotal: 2,
        pricePaise: 90000,
        validityDays: 14,
        isActive: true,
      });

    // 5. Create Child 1 for Guardian 1
    const [c1] = await scriptDb
      .insert(kidsChildren)
      .values({
        guardianUserId: guardian1,
        displayName: "Aarav Test",
        birthYear: 2018,
        schoolClass: "Class 2",
        activityNotes: "Nut allergy",
      })
      .returning();
    child1Id = c1!.id;

    // 6. Create Child 2 for Guardian 2
    const [c2] = await scriptDb
      .insert(kidsChildren)
      .values({
        guardianUserId: guardian2,
        displayName: "Diya Test",
        birthYear: 2020,
        schoolClass: "LKG",
      })
      .returning();
    child2Id = c2!.id;
  });

  afterAll(async () => {
    if (!dbAvailable) return;
    try {
      const purchases = await scriptDb
        .select({ id: kidsPassPurchases.id })
        .from(kidsPassPurchases)
        .where(eq(kidsPassPurchases.guardianUserId, guardian1));
      for (const p of purchases) {
        await scriptDb.delete(kidsPassRedemptions).where(eq(kidsPassRedemptions.purchaseId, p.id));
      }
      await scriptDb.delete(kidsPassPurchases).where(eq(kidsPassPurchases.guardianUserId, guardian1));
      await scriptDb.delete(kidsHolidayPasses).where(eq(kidsHolidayPasses.id, passId));
      await scriptDb.delete(kidsWorkshopEnrollments).where(eq(kidsWorkshopEnrollments.workshopId, workshopId));
      await scriptDb.delete(kidsWorkshops).where(eq(kidsWorkshops.id, workshopId));
      await scriptDb.delete(kidsServiceBookings).where(eq(kidsServiceBookings.vendorId, vendorId));
      await scriptDb.delete(kidsServices).where(eq(kidsServices.id, serviceId));
      await scriptDb.delete(kidsChildren).where(eq(kidsChildren.id, child1Id));
      await scriptDb.delete(kidsChildren).where(eq(kidsChildren.id, child2Id));
      await scriptDb.delete(vendors).where(eq(vendors.id, vendorId));
    } catch (e) {
      console.error("Cleanup error in tests:", e);
    }
  });

  it("enforces child privacy: guardian cannot book for another guardian's child", async () => {
    if (!dbAvailable) return;

    // Guardian 1 tries to book for Guardian 2's child (child2Id)
    const tomorrow = new Date(Date.now() + 86400000 * 2);
    const res = await createKidsBooking({
      guardianUserId: guardian1,
      childId: child2Id, // unauthorized!
      serviceId,
      startsAt: tomorrow,
      deliveryMode: "studio",
      paymentMode: "pay_at_session",
      clientKey: `test-key-unauth-${ts}`,
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toContain("belong to you");
    }
  }, 30000);

  it("creates a valid service booking and prevents slot collision", async () => {
    if (!dbAvailable) return;

    const startsAt = new Date(Date.now() + 86400000 * 3);
    startsAt.setMinutes(0, 0, 0);

    // First booking by Guardian 1
    const res1 = await createKidsBooking({
      guardianUserId: guardian1,
      childId: child1Id,
      serviceId,
      startsAt,
      deliveryMode: "studio",
      paymentMode: "pay_at_session",
      clientKey: `test-key-valid-1-${ts}`,
    });

    expect(res1.ok).toBe(true);
    if (res1.ok) {
      expect(res1.number).toContain("KBK-");
    }

    // Second booking by Guardian 2 for the exact same provider slot
    const res2 = await createKidsBooking({
      guardianUserId: guardian2,
      childId: child2Id,
      serviceId,
      startsAt,
      deliveryMode: "studio",
      paymentMode: "pay_at_session",
      clientKey: `test-key-collision-${ts}`,
    });

    expect(res2.ok).toBe(false);
    if (!res2.ok) {
      expect(res2.error).toContain("taken by another parent");
    }
  }, 30000);

  it("enforces workshop capacity clamp (capacity = 2)", async () => {
    if (!dbAvailable) return;

    // Enroll Child 1 (Seat 1 of 2)
    const e1 = await enrollInWorkshop({
      guardianUserId: guardian1,
      childId: child1Id,
      workshopId,
      clientKey: `ws-enroll-1-${ts}`,
    });
    expect(e1.ok).toBe(true);

    // Duplicate enrollment check: Guardian 1 tries to enroll Child 1 again in the same workshop
    const eDuplicate = await enrollInWorkshop({
      guardianUserId: guardian1,
      childId: child1Id,
      workshopId,
      clientKey: `ws-enroll-dup-${ts}`,
    });
    expect(eDuplicate.ok).toBe(false);
    if (!eDuplicate.ok) {
      expect(eDuplicate.error).toContain("already enrolled");
    }

    // Enroll Child 2 (Seat 2 of 2 - Full)
    const e2 = await enrollInWorkshop({
      guardianUserId: guardian2,
      childId: child2Id,
      workshopId,
      clientKey: `ws-enroll-2-${ts}`,
    });
    expect(e2.ok).toBe(true);

    // Create a 3rd child to attempt over-enrollment
    const [c3] = await scriptDb
      .insert(kidsChildren)
      .values({
        guardianUserId: guardian1,
        displayName: "Child 3 Overcapacity",
        birthYear: 2017,
      })
      .returning();

    const e3 = await enrollInWorkshop({
      guardianUserId: guardian1,
      childId: c3!.id,
      workshopId,
      clientKey: `ws-enroll-3-overflow-${ts}`,
    });

    expect(e3.ok).toBe(false);
    if (!e3.ok) {
      expect(e3.error).toContain("capacity");
    }

    await scriptDb.delete(kidsChildren).where(eq(kidsChildren.id, c3!.id));
  }, 30000);

  it("handles pass purchase, atomic credit deduction and double-redemption prevention", async () => {
    if (!dbAvailable) return;

    // 1. Purchase pass (2 credits)
    const pRes = await purchaseHolidayPass({
      guardianUserId: guardian1,
      passId,
      clientKey: `pass-purchase-${ts}`,
    });
    expect(pRes.ok).toBe(true);
    if (!pRes.ok) return;

    const purchaseId = pRes.purchaseId;

    // 2. Redeem 1 credit
    const r1 = await redeemPassCredit({
      guardianUserId: guardian1,
      purchaseId,
      clientKey: `pass-redemption-1-${ts}`,
    });
    expect(r1.ok).toBe(true);

    // Verify remaining credit in DB
    const [pRow1] = await scriptDb
      .select()
      .from(kidsPassPurchases)
      .where(eq(kidsPassPurchases.id, purchaseId));
    expect(pRow1?.remainingCredits).toBe(1);

    // 3. Idempotent re-submission of same clientKey should return ok without double deducting
    const rDuplicate = await redeemPassCredit({
      guardianUserId: guardian1,
      purchaseId,
      clientKey: `pass-redemption-1-${ts}`,
    });
    expect(rDuplicate.ok).toBe(true);

    const [pRowDup] = await scriptDb
      .select()
      .from(kidsPassPurchases)
      .where(eq(kidsPassPurchases.id, purchaseId));
    expect(pRowDup?.remainingCredits).toBe(1); // Still 1!

    // 4. Redeem second credit
    const r2 = await redeemPassCredit({
      guardianUserId: guardian1,
      purchaseId,
      clientKey: `pass-redemption-2-${ts}`,
    });
    expect(r2.ok).toBe(true);

    const [pRow2] = await scriptDb
      .select()
      .from(kidsPassPurchases)
      .where(eq(kidsPassPurchases.id, purchaseId));
    expect(pRow2?.remainingCredits).toBe(0);

    // 5. Attempt 3rd redemption when balance is 0 - MUST fail
    const r3 = await redeemPassCredit({
      guardianUserId: guardian1,
      purchaseId,
      clientKey: `pass-redemption-3-${ts}`,
    });
    expect(r3.ok).toBe(false);
    if (!r3.ok) {
      expect(r3.error).toContain("Insufficient credits");
    }
  }, 30000);
});
