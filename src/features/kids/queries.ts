import "server-only";
import { and, asc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { products, services, vendors } from "@/db/schema";
import { getRatingMap } from "@/features/platform/queries";
import type { KidsActivityItem, KidsKitItem, KidsWorkshopItem, KidsVendorSummary } from "./types";
import type { KidsCategoryId, KidsFormat } from "@/core/kids";

/**
 * Maps a service or product name to a primary kids activity category.
 */
function inferCategory(name: string, description: string = ""): KidsCategoryId {
  const text = `${name} ${description}`.toLowerCase();
  if (text.includes("robot") || text.includes("stem") || text.includes("code") || text.includes("scratch") || text.includes("sensor")) {
    return "stem";
  }
  if (text.includes("chess") || text.includes("logic") || text.includes("rubik") || text.includes("puzzle")) {
    return "logic";
  }
  if (text.includes("pottery") || text.includes("clay") || text.includes("art") || text.includes("paint") || text.includes("canvas")) {
    return "arts";
  }
  if (text.includes("karate") || text.includes("gymnastic") || text.includes("martial") || text.includes("fitness") || text.includes("yoga")) {
    return "sports";
  }
  if (text.includes("music") || text.includes("dance") || text.includes("keyboard") || text.includes("guitar") || text.includes("vocal")) {
    return "music";
  }
  if (text.includes("kit") || text.includes("montessori") || text.includes("toy") || text.includes("craft box") || text.includes("experiment")) {
    return "kits";
  }
  return "stem";
}

/**
 * Infers age range from title and description.
 */
function inferAges(name: string, description: string = ""): { min: number; max: number } {
  const text = `${name} ${description}`.toLowerCase();
  if (text.includes("toddler") || text.includes("3-5") || text.includes("3–5") || text.includes("preschool")) {
    return { min: 3, max: 5 };
  }
  if (text.includes("4-10") || text.includes("4–10") || text.includes("4-12") || text.includes("4–12")) {
    return { min: 4, max: 10 };
  }
  if (text.includes("6-14") || text.includes("6–14") || text.includes("6-12") || text.includes("6–12") || text.includes("6+")) {
    return { min: 6, max: 12 };
  }
  if (text.includes("teen") || text.includes("13+") || text.includes("12-16")) {
    return { min: 13, max: 17 };
  }
  return { min: 5, max: 12 };
}

/**
 * Infers appropriate emoji for activity.
 */
function inferEmoji(category: KidsCategoryId): string {
  switch (category) {
    case "stem":
      return "🚀";
    case "arts":
      return "🎨";
    case "logic":
      return "♟️";
    case "sports":
      return "🥋";
    case "music":
      return "🎵";
    case "kits":
      return "🧩";
    default:
      return "🎈";
  }
}

/**
 * Fetch all kids activities and classes.
 */
export async function getKidsActivities(): Promise<KidsActivityItem[]> {
  const db = getDb();
  const getRatings = await getRatingMap();

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
    const category = inferCategory(service.name, service.description ?? "");
    const { min: ageMin, max: ageMax } = inferAges(service.name, service.description ?? "");
    const ratingSummary = getRatings(vendor.id);

    const primaryMode = service.modes[0] ?? "studio";
    const format: KidsFormat =
      primaryMode === "home" ? "home_visit" : primaryMode === "online" ? "online_live" : "studio";

    const isTrial = service.name.toLowerCase().includes("trial");

    return {
      id: service.id,
      serviceId: service.id,
      name: service.name,
      description: service.description ?? "Interactive and hands-on session tailored for young minds.",
      ageMin,
      ageMax,
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
        rating: ratingSummary.average ?? 4.9,
        reviewCount: ratingSummary.count ?? 12,
        serviceModes: service.modes,
      },
      badge: isTrial ? "⭐ TRIAL CLASS" : "🏆 SMALL BATCH",
      emoji: inferEmoji(category),
      highlights: [
        "Small batch (max 6 students)",
        "Verified background-checked mentor",
        "Take-home project & certificate",
      ],
    };
  });
}

/**
 * Curated upcoming kids workshops and weekend bootcamps.
 */
export async function getKidsWorkshops(): Promise<KidsWorkshopItem[]> {
  const activities = await getKidsActivities();

  // Find workshops among activities or fallback to curated upcoming workshop schedule
  const workshopActivities = activities.filter(
    (a) =>
      a.name.toLowerCase().includes("workshop") ||
      a.name.toLowerCase().includes("camp") ||
      a.name.toLowerCase().includes("bootcamp") ||
      a.durationMinutes >= 75
  );

  const weekendSchedule = [
    { date: "This Saturday", time: "10:30 AM – 12:30 PM", spots: 8, enrolled: 6 },
    { date: "This Sunday", time: "4:00 PM – 5:30 PM", spots: 6, enrolled: 4 },
    { date: "Next Saturday", time: "11:00 AM – 1:00 PM", spots: 10, enrolled: 7 },
  ];

  if (workshopActivities.length > 0) {
    return workshopActivities.map((act, index) => {
      const schedule = weekendSchedule[index % weekendSchedule.length]!;
      return {
        id: `ws-${act.id}`,
        serviceId: act.serviceId,
        title: act.name,
        description: act.description,
        dateLabel: schedule.date,
        timeLabel: schedule.time,
        minAge: act.ageMin,
        maxAge: act.ageMax,
        category: act.category,
        format: act.format,
        vendor: act.vendor,
        pricePaise: act.pricePaise,
        batchSize: schedule.spots,
        enrolledCount: schedule.enrolled,
        emoji: act.emoji,
        badge: "CAMP",
      };
    });
  }

  // Fallback curated workshop items linked to the first kids vendor
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

/**
 * Fetch hands-on DIY Learning Kits & Activity Boxes delivered to home.
 */
export async function getKidsKits(): Promise<KidsKitItem[]> {
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
    const category = inferCategory(product.name, product.description ?? "");
    const { min: minAge, max: maxAge } = inferAges(product.name, product.description ?? "");
    const ratingSummary = getRatings(vendor.id);

    return {
      id: product.id,
      productId: product.id,
      name: product.name,
      description: product.description ?? "Fun hands-on learning kit delivered to your doorstep.",
      minAge,
      maxAge,
      pricePaise: product.pricePaise,
      category,
      vendor: {
        id: vendor.id,
        name: vendor.name,
        slug: vendor.slug,
        area: vendor.area,
        rating: ratingSummary.average ?? 4.9,
        reviewCount: ratingSummary.count ?? 14,
        serviceModes: ["delivery"],
      },
      features: [
        "100% Non-toxic & kid-safe materials",
        "Step-by-step illustrated guide",
        "Same-day or next-day home delivery",
      ],
      emoji: inferEmoji(category),
      badge: "DOORSTEP KIT",
    };
  });
}
