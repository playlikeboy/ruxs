import "server-only";
import { and, asc, count, desc, eq, gte, inArray, isNull, lte } from "drizzle-orm";
import { getDb } from "@/db";
import {
  kidsCategories,
  kidsChildren,
  kidsHolidayPasses,
  kidsMaterialPackages,
  kidsPassPurchases,
  kidsProviderProfiles,
  kidsReviews,
  kidsServiceBookings,
  kidsServices,
  kidsWorkshopEnrollments,
  kidsWorkshopSessions,
  kidsWorkshops,
  products,
  services,
  vendors,
} from "@/db/schema";
import { readTypeProfile } from "@/features/vendor-types/tables";
import { isVendorType } from "@/core/vendor-types";
import { requireAdmin, requireUser, requireVendorAccess } from "@/lib/auth/session";
import { getRatingMap } from "@/features/platform/queries";
import { getNearbyVendorDistances } from "@/features/consumer/queries";
import { calculateWorkshopAvailability } from "@/core/kids/workshop-capacity";
import type { KidsActivityItem, KidsKitItem, KidsWorkshopItem, KidsVendorSummary } from "./types";
import type { KidsCategoryId, KidsFormat } from "@/core/kids";

/**
 * All active categories in display order.
 */
export async function getKidsCategories() {
  const db = getDb();
  return db
    .select()
    .from(kidsCategories)
    .where(eq(kidsCategories.isActive, true))
    .orderBy(asc(kidsCategories.sort), asc(kidsCategories.name));
}

export async function getKidsCategoryById(id: string) {
  const db = getDb();
  const [cat] = await db
    .select()
    .from(kidsCategories)
    .where(and(eq(kidsCategories.id, id), eq(kidsCategories.isActive, true)))
    .limit(1);
  return cat ?? null;
}

/**
 * Filtered search for kids activities & classes.
 */
export async function searchKidsServices(filters?: {
  categoryId?: string;
  age?: number;
  deliveryMode?: "home" | "studio" | "online";
  searchQuery?: string;
}) {
  const db = getDb();
  const conditions = [
    eq(kidsServices.isActive, true),
    isNull(kidsServices.archivedAt),
    eq(vendors.status, "active"),
  ];

  if (filters?.categoryId && filters.categoryId !== "all") {
    conditions.push(eq(kidsServices.categoryId, filters.categoryId));
  }

  if (filters?.age && filters.age > 0) {
    conditions.push(lte(kidsServices.minAge, filters.age));
    conditions.push(gte(kidsServices.maxAge, filters.age));
  }

  const rows = await db
    .select({
      service: kidsServices,
      category: kidsCategories,
      vendor: vendors,
      profile: kidsProviderProfiles,
    })
    .from(kidsServices)
    .innerJoin(kidsCategories, eq(kidsServices.categoryId, kidsCategories.id))
    .innerJoin(vendors, eq(kidsServices.vendorId, vendors.id))
    .leftJoin(kidsProviderProfiles, eq(vendors.id, kidsProviderProfiles.vendorId))
    .where(and(...conditions))
    .orderBy(asc(kidsServices.pricePaise));

  const query = filters?.searchQuery?.trim().toLowerCase();
  if (!query) return rows;

  return rows.filter(({ service, vendor, category }) => {
    const haystack = `${service.title} ${service.description} ${vendor.name} ${vendor.area} ${category.name}`.toLowerCase();
    return haystack.includes(query);
  });
}

/**
 * Detailed single service view.
 */
export async function getKidsServiceById(id: string) {
  const db = getDb();
  const [row] = await db
    .select({
      service: kidsServices,
      category: kidsCategories,
      vendor: vendors,
      profile: kidsProviderProfiles,
    })
    .from(kidsServices)
    .innerJoin(kidsCategories, eq(kidsServices.categoryId, kidsCategories.id))
    .innerJoin(vendors, eq(kidsServices.vendorId, vendors.id))
    .leftJoin(kidsProviderProfiles, eq(vendors.id, kidsProviderProfiles.vendorId))
    .where(
      and(
        eq(kidsServices.id, id),
        eq(kidsServices.isActive, true),
        isNull(kidsServices.archivedAt),
        eq(vendors.status, "active")
      )
    )
    .limit(1);

  if (!row) return null;

  const materials = await db
    .select()
    .from(kidsMaterialPackages)
    .where(and(eq(kidsMaterialPackages.serviceId, id), eq(kidsMaterialPackages.isActive, true)));

  return { ...row, materials };
}

/**
 * Workshops discovery catalog.
 */
export async function getKidsWorkshopsCatalog(filters?: {
  categoryId?: string;
  searchQuery?: string;
}) {
  const db = getDb();
  const conditions = [
    eq(kidsWorkshops.publicationState, "published"),
    eq(vendors.status, "active"),
  ];

  if (filters?.categoryId && filters.categoryId !== "all") {
    conditions.push(eq(kidsWorkshops.categoryId, filters.categoryId));
  }

  const rows = await db
    .select({
      workshop: kidsWorkshops,
      category: kidsCategories,
      vendor: vendors,
      profile: kidsProviderProfiles,
    })
    .from(kidsWorkshops)
    .innerJoin(kidsCategories, eq(kidsWorkshops.categoryId, kidsCategories.id))
    .innerJoin(vendors, eq(kidsWorkshops.vendorId, vendors.id))
    .leftJoin(kidsProviderProfiles, eq(vendors.id, kidsProviderProfiles.vendorId))
    .where(and(...conditions))
    .orderBy(asc(kidsWorkshops.startDate));

  // Fetch enrollment counts for capacity calculations
  const workshopIds = rows.map((r) => r.workshop.id);
  const enrollmentMap = new Map<string, number>();

  if (workshopIds.length > 0) {
    const counts = await db
      .select({
        workshopId: kidsWorkshopEnrollments.workshopId,
        count: count(),
      })
      .from(kidsWorkshopEnrollments)
      .where(
        and(
          inArray(kidsWorkshopEnrollments.workshopId, workshopIds),
          inArray(kidsWorkshopEnrollments.status, ["pending", "confirmed"])
        )
      )
      .groupBy(kidsWorkshopEnrollments.workshopId);

    for (const c of counts) {
      enrollmentMap.set(c.workshopId, Number(c.count));
    }
  }

  const results = rows.map((r) => {
    const enrolled = enrollmentMap.get(r.workshop.id) ?? 0;
    const availability = calculateWorkshopAvailability(r.workshop.capacity, enrolled);
    return {
      ...r,
      enrolledCount: enrolled,
      availability,
    };
  });

  const query = filters?.searchQuery?.trim().toLowerCase();
  if (!query) return results;

  return results.filter(({ workshop, vendor, category }) => {
    const haystack = `${workshop.title} ${workshop.description} ${vendor.name} ${category.name}`.toLowerCase();
    return haystack.includes(query);
  });
}

/**
 * Detailed single workshop view.
 */
export async function getKidsWorkshopById(id: string) {
  const db = getDb();
  const [row] = await db
    .select({
      workshop: kidsWorkshops,
      category: kidsCategories,
      vendor: vendors,
      profile: kidsProviderProfiles,
    })
    .from(kidsWorkshops)
    .innerJoin(kidsCategories, eq(kidsWorkshops.categoryId, kidsCategories.id))
    .innerJoin(vendors, eq(kidsWorkshops.vendorId, vendors.id))
    .leftJoin(kidsProviderProfiles, eq(vendors.id, kidsProviderProfiles.vendorId))
    .where(and(eq(kidsWorkshops.id, id), eq(kidsWorkshops.publicationState, "published")))
    .limit(1);

  if (!row) return null;

  const [sessions, enrolledCountRow, materials] = await Promise.all([
    db
      .select()
      .from(kidsWorkshopSessions)
      .where(and(eq(kidsWorkshopSessions.workshopId, id), eq(kidsWorkshopSessions.isActive, true)))
      .orderBy(asc(kidsWorkshopSessions.sessionOrder), asc(kidsWorkshopSessions.sessionDate)),
    db
      .select({ count: count() })
      .from(kidsWorkshopEnrollments)
      .where(
        and(
          eq(kidsWorkshopEnrollments.workshopId, id),
          inArray(kidsWorkshopEnrollments.status, ["pending", "confirmed"])
        )
      ),
    db
      .select()
      .from(kidsMaterialPackages)
      .where(and(eq(kidsMaterialPackages.workshopId, id), eq(kidsMaterialPackages.isActive, true))),
  ]);

  const enrolledCount = Number(enrolledCountRow[0]?.count ?? 0);
  const availability = calculateWorkshopAvailability(row.workshop.capacity, enrolledCount);

  return {
    ...row,
    sessions,
    materials,
    enrolledCount,
    availability,
  };
}

/**
 * Public provider profile view with verified status vs claimed credentials.
 */
export async function getKidsProviderBySlug(slug: string) {
  const db = getDb();
  const [vendor] = await db
    .select()
    .from(vendors)
    .where(and(eq(vendors.slug, slug), eq(vendors.status, "active")))
    .limit(1);

  if (!vendor) return null;

  const [profile] = await db
    .select()
    .from(kidsProviderProfiles)
    .where(eq(kidsProviderProfiles.vendorId, vendor.id))
    .limit(1);

  const [providerServices, providerWorkshops, reviews] = await Promise.all([
    db
      .select({
        service: kidsServices,
        category: kidsCategories,
      })
      .from(kidsServices)
      .innerJoin(kidsCategories, eq(kidsServices.categoryId, kidsCategories.id))
      .where(
        and(
          eq(kidsServices.vendorId, vendor.id),
          eq(kidsServices.isActive, true),
          isNull(kidsServices.archivedAt)
        )
      )
      .orderBy(asc(kidsServices.pricePaise)),
    db
      .select({
        workshop: kidsWorkshops,
        category: kidsCategories,
      })
      .from(kidsWorkshops)
      .innerJoin(kidsCategories, eq(kidsWorkshops.categoryId, kidsCategories.id))
      .where(
        and(
          eq(kidsWorkshops.vendorId, vendor.id),
          eq(kidsWorkshops.publicationState, "published")
        )
      )
      .orderBy(asc(kidsWorkshops.startDate)),
    db
      .select()
      .from(kidsReviews)
      .where(and(eq(kidsReviews.vendorId, vendor.id), eq(kidsReviews.moderationStatus, "published")))
      .orderBy(desc(kidsReviews.createdAt))
      .limit(20),
  ]);

  const typeProfile = isVendorType(vendor.vendorType) ? await readTypeProfile(db, vendor.id, vendor.vendorType) : null;
  const mergedProfile = {
    headline: (typeProfile?.headline as string | null) ?? profile?.headline ?? null,
    qualifications: (typeProfile?.qualifications as string | null) ?? profile?.qualifications ?? null,
    experienceYears: (typeProfile?.experienceYears as number | null) ?? profile?.experienceYears ?? 0,
    specialties: ((typeProfile?.specialities || typeProfile?.subjects || typeProfile?.artForms || typeProfile?.disciplines) as string[] | null) ?? profile?.specialties ?? [],
    languages: (typeProfile?.languages as string[] | null) ?? profile?.languages ?? [],
    verificationStatus: profile?.verificationStatus ?? "approved",
    safetyReviewStatus: profile?.safetyReviewStatus ?? "passed",
    safetyNotes: profile?.safetyNotes ?? null,
    certificates: (typeProfile?.certificates as string[] | null) ?? [],
    galleryImages: (typeProfile?.galleryImages as string[] | null) ?? [],
    previewVideoUrl: (typeProfile?.previewVideoUrl as string | null) ?? (typeProfile?.sampleProjectsVideoUrl as string | null) ?? null,
    homeTuitionAvailable: (typeProfile?.homeTuitionAvailable as boolean | null) ?? false,
    guardianSupervisionRequired: (typeProfile?.guardianSupervisionRequired as boolean | null) ?? true,
  };

  return {
    vendor,
    profile: mergedProfile,
    services: providerServices,
    workshops: providerWorkshops,
    reviews,
  };
}

/**
 * Child profiles owned strictly by the authenticated parent/guardian.
 */
export async function getMyChildren() {
  const user = await requireUser();
  const db = getDb();

  return db
    .select()
    .from(kidsChildren)
    .where(eq(kidsChildren.guardianUserId, user.id))
    .orderBy(asc(kidsChildren.displayName));
}

/**
 * Bookings for authenticated parent/guardian.
 */
export async function getMyKidsBookings() {
  const user = await requireUser();
  const db = getDb();

  return db
    .select({
      booking: kidsServiceBookings,
      service: kidsServices,
      child: kidsChildren,
      vendor: vendors,
    })
    .from(kidsServiceBookings)
    .innerJoin(kidsChildren, eq(kidsServiceBookings.childId, kidsChildren.id))
    .leftJoin(kidsServices, eq(kidsServiceBookings.serviceId, kidsServices.id))
    .innerJoin(vendors, eq(kidsServiceBookings.vendorId, vendors.id))
    .where(eq(kidsServiceBookings.guardianUserId, user.id))
    .orderBy(desc(kidsServiceBookings.startsAt));
}

/**
 * Workshop enrollments for authenticated parent/guardian.
 */
export async function getMyKidsEnrollments() {
  const user = await requireUser();
  const db = getDb();

  return db
    .select({
      enrollment: kidsWorkshopEnrollments,
      workshop: kidsWorkshops,
      child: kidsChildren,
      vendor: vendors,
    })
    .from(kidsWorkshopEnrollments)
    .innerJoin(kidsChildren, eq(kidsWorkshopEnrollments.childId, kidsChildren.id))
    .innerJoin(kidsWorkshops, eq(kidsWorkshopEnrollments.workshopId, kidsWorkshops.id))
    .innerJoin(vendors, eq(kidsWorkshops.vendorId, vendors.id))
    .where(eq(kidsWorkshopEnrollments.guardianUserId, user.id))
    .orderBy(desc(kidsWorkshopEnrollments.createdAt));
}

/**
 * Holiday pass definitions and purchases.
 */
export async function getAvailableHolidayPasses() {
  const db = getDb();
  return db
    .select()
    .from(kidsHolidayPasses)
    .where(eq(kidsHolidayPasses.isActive, true))
    .orderBy(asc(kidsHolidayPasses.pricePaise));
}

export async function getMyKidsPasses() {
  const user = await requireUser();
  const db = getDb();

  return db
    .select({
      purchase: kidsPassPurchases,
      pass: kidsHolidayPasses,
    })
    .from(kidsPassPurchases)
    .innerJoin(kidsHolidayPasses, eq(kidsPassPurchases.passId, kidsHolidayPasses.id))
    .where(eq(kidsPassPurchases.guardianUserId, user.id))
    .orderBy(desc(kidsPassPurchases.createdAt));
}

/**
 * Provider kids workspace data for `/merchant-panel/[vendor]/kids`.
 */
export async function getProviderKidsWorkspace(slug: string) {
  const access = await requireVendorAccess(slug, ["owner", "staff"]);
  const db = getDb();

  const [vendor] = await db
    .select()
    .from(vendors)
    .where(eq(vendors.id, access.vendorId))
    .limit(1);

  if (!vendor) throw new Error("Vendor not found");

  const [profile] = await db
    .select()
    .from(kidsProviderProfiles)
    .where(eq(kidsProviderProfiles.vendorId, vendor.id))
    .limit(1);

  const [servicesList, workshopsList, bookingsList, enrollmentsList] = await Promise.all([
    db
      .select({
        service: kidsServices,
        category: kidsCategories,
      })
      .from(kidsServices)
      .innerJoin(kidsCategories, eq(kidsServices.categoryId, kidsCategories.id))
      .where(and(eq(kidsServices.vendorId, vendor.id), isNull(kidsServices.archivedAt)))
      .orderBy(asc(kidsServices.title)),
    db
      .select({
        workshop: kidsWorkshops,
        category: kidsCategories,
      })
      .from(kidsWorkshops)
      .innerJoin(kidsCategories, eq(kidsWorkshops.categoryId, kidsCategories.id))
      .where(eq(kidsWorkshops.vendorId, vendor.id))
      .orderBy(desc(kidsWorkshops.startDate)),
    db
      .select({
        booking: kidsServiceBookings,
        service: kidsServices,
        child: kidsChildren,
      })
      .from(kidsServiceBookings)
      .innerJoin(kidsChildren, eq(kidsServiceBookings.childId, kidsChildren.id))
      .leftJoin(kidsServices, eq(kidsServiceBookings.serviceId, kidsServices.id))
      .where(eq(kidsServiceBookings.vendorId, vendor.id))
      .orderBy(desc(kidsServiceBookings.startsAt))
      .limit(50),
    db
      .select({
        enrollment: kidsWorkshopEnrollments,
        workshop: kidsWorkshops,
        child: kidsChildren,
      })
      .from(kidsWorkshopEnrollments)
      .innerJoin(kidsChildren, eq(kidsWorkshopEnrollments.childId, kidsChildren.id))
      .innerJoin(kidsWorkshops, eq(kidsWorkshopEnrollments.workshopId, kidsWorkshops.id))
      .where(eq(kidsWorkshops.vendorId, vendor.id))
      .orderBy(desc(kidsWorkshopEnrollments.createdAt))
      .limit(50),
  ]);

  return {
    vendor,
    profile: profile ?? null,
    services: servicesList,
    workshops: workshopsList,
    bookings: bookingsList,
    enrollments: enrollmentsList,
  };
}

/**
 * Admin kids console data for `/admin/kids`.
 */
export async function getAdminKidsConsoleData() {
  await requireAdmin();
  const db = getDb();

  const [categoriesList, providersList, passesList, reviewsList] = await Promise.all([
    db.select().from(kidsCategories).orderBy(asc(kidsCategories.sort)),
    db
      .select({
        vendor: vendors,
        profile: kidsProviderProfiles,
      })
      .from(vendors)
      .leftJoin(kidsProviderProfiles, eq(vendors.id, kidsProviderProfiles.vendorId))
      .where(eq(vendors.status, "active"))
      .orderBy(asc(vendors.name)),
    db.select().from(kidsHolidayPasses).orderBy(asc(kidsHolidayPasses.pricePaise)),
    db
      .select({
        review: kidsReviews,
        vendor: vendors,
      })
      .from(kidsReviews)
      .innerJoin(vendors, eq(kidsReviews.vendorId, vendors.id))
      .orderBy(desc(kidsReviews.createdAt))
      .limit(50),
  ]);

  return {
    categories: categoriesList,
    providers: providersList,
    passes: passesList,
    reviews: reviewsList,
  };
}

/* -------------------------------------------------------------------------- */
/* Backward Compatibility Adapter for Initial Explore UI                      */
/* -------------------------------------------------------------------------- */

function inferCategoryFallback(name: string, description: string = ""): KidsCategoryId {
  const text = `${name} ${description}`.toLowerCase();
  if (text.includes("robot") || text.includes("stem") || text.includes("code") || text.includes("scratch")) return "stem";
  if (text.includes("chess") || text.includes("logic")) return "logic";
  if (text.includes("pottery") || text.includes("clay") || text.includes("art")) return "arts";
  if (text.includes("karate") || text.includes("fitness")) return "sports";
  if (text.includes("music") || text.includes("dance")) return "music";
  return "stem";
}

function inferEmojiFallback(cat: KidsCategoryId): string {
  switch (cat) {
    case "stem": return "🚀";
    case "arts": return "🎨";
    case "logic": return "♟️";
    case "sports": return "🥋";
    case "music": return "🎵";
    default: return "🎈";
  }
}

async function allActivities(): Promise<KidsActivityItem[]> {
  const db = getDb();
  const getRatings = await getRatingMap();

  // 1. Fetch domain-specific kids_services
  const domainRows = await db
    .select({
      service: kidsServices,
      category: kidsCategories,
      vendor: vendors,
    })
    .from(kidsServices)
    .innerJoin(kidsCategories, eq(kidsServices.categoryId, kidsCategories.id))
    .innerJoin(vendors, eq(kidsServices.vendorId, vendors.id))
    .where(
      and(
        eq(kidsServices.isActive, true),
        isNull(kidsServices.archivedAt),
        eq(vendors.status, "active")
      )
    )
    .orderBy(asc(kidsServices.pricePaise));

  if (domainRows.length > 0) {
    return domainRows.map(({ service, category, vendor }): KidsActivityItem => {
      const ratingSummary = getRatings(vendor.id);
      const primaryMode = service.deliveryModes[0] ?? "studio";
      const format: KidsFormat =
        primaryMode === "home" ? "home_visit" : primaryMode === "online" ? "online_live" : "studio";
      const catKey = (category.id as KidsCategoryId) || "stem";

      return {
        id: service.id,
        serviceId: service.id,
        name: service.title,
        description: service.description ?? "Interactive session tailored for young minds.",
        ageMin: service.minAge,
        ageMax: service.maxAge,
        durationMinutes: service.durationMinutes,
        pricePaise: service.pricePaise,
        trialPricePaise: Math.round(service.pricePaise * 0.7),
        category: catKey,
        format,
        vendor: {
          id: vendor.id,
          name: vendor.name,
          slug: vendor.slug,
          area: vendor.area,
          rating: ratingSummary.average ?? 0,
          reviewCount: ratingSummary.count ?? 0,
          serviceModes: service.deliveryModes,
        },
        badge: "⭐ VERIFIED MENTOR",
        emoji: category.emoji || inferEmojiFallback(catKey),
        highlights: [
          "Small batch (max 6 students)",
          "Verified background-checked mentor",
          "Take-home project & certificate",
        ],
        posterUrl: service.imageUrl ?? undefined,
        homeSupervisionRequired: service.deliveryModes.includes("home"),
        verifiedTutor: true,
      };
    });
  }

  // Fallback to legacy services table if domain is unseeded
  const rows = await db
    .select({
      service: services,
      vendor: vendors,
    })
    .from(services)
    .innerJoin(vendors, eq(services.vendorId, vendors.id))
    .where(
      and(
        eq(services.categoryId, "kids"),
        eq(vendors.status, "active"),
        isNull(services.archivedAt),
        eq(services.isActive, true)
      )
    )
    .orderBy(asc(services.sort), asc(services.pricePaise));

  return rows.map(({ service, vendor }): KidsActivityItem => {
    const category = inferCategoryFallback(service.name, service.description ?? "");
    const ratingSummary = getRatings(vendor.id);
    const primaryMode = service.modes[0] ?? "studio";
    const format: KidsFormat =
      primaryMode === "home" ? "home_visit" : primaryMode === "online" ? "online_live" : "studio";
    const isTrial = service.name.toLowerCase().includes("trial");

    return {
      id: service.id,
      serviceId: service.id,
      name: service.name,
      description: service.description ?? "Interactive session tailored for young minds.",
      ageMin: 5,
      ageMax: 12,
      durationMinutes: service.durationMinutes,
      pricePaise: service.pricePaise,
      trialPricePaise: isTrial ? service.pricePaise : Math.round(service.pricePaise * 0.7),
      category,
      format,
      vendor: {
        id: vendor.id,
        name: vendor.name,
        slug: vendor.slug,
        area: vendor.area,
        rating: ratingSummary.average ?? 0,
        reviewCount: ratingSummary.count ?? 0,
        serviceModes: service.modes,
      },
      badge: isTrial ? "⭐ TRIAL CLASS" : "🏆 SMALL BATCH",
      emoji: inferEmojiFallback(category),
      highlights: [
        "Small batch (max 6 students)",
        "Verified background-checked mentor",
        "Take-home project & certificate",
      ],
    };
  });
}

async function allWorkshops(): Promise<KidsWorkshopItem[]> {
  const catalog = await getKidsWorkshopsCatalog();
  const getRatings = await getRatingMap();

  if (catalog.length > 0) {
    return catalog.map(({ workshop, category, vendor, availability, enrolledCount }): KidsWorkshopItem => {
      const ratingSummary = getRatings(vendor.id);
      const catKey = (category.id as KidsCategoryId) || "stem";
      const isOnline = workshop.venueOrMode.toLowerCase().includes("online");
      const isHome = workshop.venueOrMode.toLowerCase().includes("home");
      const format: KidsFormat = isHome ? "home_visit" : isOnline ? "online_live" : "studio";

      return {
        id: workshop.id,
        title: workshop.title,
        description: workshop.description ?? "Interactive holiday bootcamp.",
        dateLabel: `${workshop.startDate} to ${workshop.endDate}`,
        timeLabel: "Weekend Batch",
        minAge: workshop.minAge,
        maxAge: workshop.maxAge,
        category: catKey,
        format,
        vendor: {
          id: vendor.id,
          name: vendor.name,
          slug: vendor.slug,
          area: vendor.area,
          rating: ratingSummary.average ?? 0,
          reviewCount: ratingSummary.count ?? 0,
          serviceModes: ["studio", "home"],
        },
        pricePaise: workshop.pricePaise,
        batchSize: workshop.capacity,
        enrolledCount,
        emoji: category.emoji || "🏕️",
        badge: availability.isAlmostFull ? "🔥 FILLING FAST" : "WEEKEND CAMP",
        posterUrl: undefined,
      };
    });
  }

  const activities = await getKidsActivities();
  const firstVendor: KidsVendorSummary = activities[0]?.vendor ?? {
    id: "demo-v",
    name: "RoboSparks Kids STEM & Robotics Lab",
    slug: "robosparks-kids-stem-ranchi",
    area: "Morabadi",
    rating: 4.9,
    reviewCount: 16,
    serviceModes: ["studio", "home"],
  };

  return [
    {
      id: "ws-stem-rover",
      title: "Mars Rover Robotics & Sensors Bootcamp",
      description: "Build an ultrasonic obstacle-avoiding rover car with motors and real breadboards.",
      dateLabel: "This Saturday",
      timeLabel: "10:30 AM – 12:30 PM",
      minAge: 7,
      maxAge: 13,
      category: "stem",
      format: "studio",
      vendor: firstVendor,
      pricePaise: 120000,
      batchSize: 8,
      enrolledCount: 6,
      emoji: "🚀",
      badge: "WEEKEND CAMP",
    },
    {
      id: "ws-clay-pottery",
      title: "Mess-Free Pottery Wheel & Clay Sculpting Carnival",
      description: "Shape bowls, vases, and mini cartoon sculptures using kid-friendly pottery wheels.",
      dateLabel: "This Sunday",
      timeLabel: "4:00 PM – 5:30 PM",
      minAge: 4,
      maxAge: 11,
      category: "arts",
      format: "studio",
      vendor: firstVendor,
      pricePaise: 49900,
      batchSize: 6,
      enrolledCount: 5,
      emoji: "🎨",
      badge: "MESS-FREE FUN",
    },
    {
      id: "ws-chess-blitz",
      title: "Grandmaster Chess Blitz & Tactics Arena",
      description: "Master sneaky forks, skewers, and 3-move checkmates with a rated FIDE coach.",
      dateLabel: "Next Saturday",
      timeLabel: "3:00 PM – 5:00 PM",
      minAge: 6,
      maxAge: 14,
      category: "logic",
      format: "studio",
      vendor: firstVendor,
      pricePaise: 50000,
      batchSize: 10,
      enrolledCount: 7,
      emoji: "♟️",
      badge: "POPULAR",
    },
  ];
}

async function allKits(): Promise<KidsKitItem[]> {
  const db = getDb();
  const getRatings = await getRatingMap();

  const rows = await db
    .select({
      product: products,
      vendor: vendors,
    })
    .from(products)
    .innerJoin(vendors, eq(products.vendorId, vendors.id))
    .where(
      and(
        eq(products.kind, "kids-kits"),
        eq(vendors.status, "active"),
        isNull(products.archivedAt),
        eq(products.isAvailable, true)
      )
    )
    .orderBy(asc(products.pricePaise));

  return rows.map(({ product, vendor }): KidsKitItem => {
    const category = inferCategoryFallback(product.name, product.description ?? "");
    const ratingSummary = getRatings(vendor.id);

    return {
      id: product.id,
      productId: product.id,
      name: product.name,
      description: product.description ?? "Fun hands-on learning kit delivered to your doorstep.",
      minAge: 4,
      maxAge: 11,
      pricePaise: product.pricePaise,
      category,
      vendor: {
        id: vendor.id,
        name: vendor.name,
        slug: vendor.slug,
        area: vendor.area,
        rating: ratingSummary.average ?? 0,
        reviewCount: ratingSummary.count ?? 0,
        serviceModes: ["delivery"],
      },
      features: [
        "100% Non-toxic & kid-safe materials",
        "Step-by-step illustrated guide",
        "Same-day or next-day home delivery",
      ],
      emoji: "🧩",
      badge: "DOORSTEP KIT",
      posterUrl: product.imageUrl ?? undefined,
      nonToxicCertified: true,
    };
  });
}

/** Geofence: households only see kids classes, workshops and kits from providers within the discovery radius. */
async function nearby<T extends { vendor: { id: string } }>(items: T[]): Promise<T[]> {
  const near = await getNearbyVendorDistances();
  return items.filter((i) => near.has(i.vendor.id)).sort((a, b) => (near.get(a.vendor.id) ?? 0) - (near.get(b.vendor.id) ?? 0));
}

export async function getKidsActivities(): Promise<KidsActivityItem[]> {
  return nearby(await allActivities());
}

export async function getKidsWorkshops(): Promise<KidsWorkshopItem[]> {
  return nearby(await allWorkshops());
}

export async function getKidsKits(): Promise<KidsKitItem[]> {
  return nearby(await allKits());
}
