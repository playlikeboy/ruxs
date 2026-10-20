import { scriptDb, scriptPool } from "./script-client";
import {
  kidsHolidayPasses,
  kidsProviderProfiles,
  kidsServices,
  kidsWorkshopSessions,
  kidsWorkshops,
  vendors,
} from "./schema";
import { and, eq } from "drizzle-orm";

async function seedKidsDomain() {
  console.log("Seeding Kids Domain tables on Neon DB...");

  // 1. Holiday Passes
  const PASSES = [
    {
      id: "holiday-explorer-4x",
      name: "Holiday Explorer Pass (4 Sessions)",
      description: "Any 4 studio classes or workshops across STEM, Arts, Chess and Music. Valid 30 days.",
      eligibleScope: "all",
      creditsTotal: 4,
      pricePaise: 149900,
      validityDays: 30,
      terms: "Credits can be redeemed for any eligible single session or weekend workshop. 1 credit per session.",
      isActive: true,
    },
    {
      id: "weekend-mastery-8x",
      name: "Weekend Activity Champion (8 Sessions)",
      description: "8 activity credits with priority booking and free material add-ons for holiday camps.",
      eligibleScope: "all",
      creditsTotal: 8,
      pricePaise: 279900,
      validityDays: 60,
      terms: "Valid across all verified partner academies for 60 days. Cancel up to 12 hours before without losing credits.",
      isActive: true,
    },
  ];

  for (const pass of PASSES) {
    await scriptDb
      .insert(kidsHolidayPasses)
      .values(pass)
      .onConflictDoUpdate({
        target: kidsHolidayPasses.id,
        set: pass,
      });
    console.log("✓ Pass:", pass.id);
  }

  // 2. Fetch existing demo vendors to associate services
  const stemVendor = (await scriptDb.select().from(vendors).where(eq(vendors.slug, "robosparks-kids-stem-ranchi")).limit(1))[0];
  const chessVendor = (await scriptDb.select().from(vendors).where(eq(vendors.slug, "mindcraft-kids-chess-ranchi")).limit(1))[0];
  const artVendor = (await scriptDb.select().from(vendors).where(eq(vendors.slug, "little-picassos-art-ranchi")).limit(1))[0];

  if (!stemVendor || !chessVendor || !artVendor) {
    console.warn("Some demo vendors not found, please ensure seed-storefronts ran first.");
    return;
  }

  // 3. Provider Profiles (Approved & Safety Passed)
  const PROFILES = [
    {
      vendorId: stemVendor.id,
      headline: "Certified STEM Educators · LEGO Robotics & Scratch Coding",
      qualifications: "B.Tech & Certified LEGO Education Master Trainer",
      experienceYears: 6,
      specialties: ["LEGO Robotics", "Scratch Coding", "Electronics & Sensors", "School Science Projects"],
      languages: ["English", "Hindi"],
      ageGroupsServed: ["Ages 4–6", "Ages 7–9", "Ages 10–12"],
      verificationStatus: "approved" as const,
      safetyReviewStatus: "passed" as const,
      safetyNotes: "Verified ID, background check clear, premises inspected for child safety.",
    },
    {
      vendorId: chessVendor.id,
      headline: "FIDE Rated Chess Academy · Fun Tactics & Tournament Prep",
      qualifications: "FIDE Instructor, National Chess Arbiter",
      experienceYears: 10,
      specialties: ["Chess Openings", "Tactical Puzzles", "Endgame Mastery", "Cognitive Thinking"],
      languages: ["Hindi", "English"],
      ageGroupsServed: ["Ages 5–7", "Ages 8–11"],
      verificationStatus: "approved" as const,
      safetyReviewStatus: "passed" as const,
      safetyNotes: "Verified coach credentials, child-friendly learning environment.",
    },
    {
      vendorId: artVendor.id,
      headline: "Mess-Free Pottery Wheel, Canvas Painting & Craft Studio",
      qualifications: "Bachelor of Fine Arts (BFA), Certified Child Art Therapist",
      experienceYears: 7,
      specialties: ["Pottery Wheel", "Acrylic Painting", "Clay Sculpting", "Origami"],
      languages: ["Hindi", "English"],
      ageGroupsServed: ["Ages 3–5", "Ages 6–8", "Ages 9–11"],
      verificationStatus: "approved" as const,
      safetyReviewStatus: "passed" as const,
      safetyNotes: "Non-toxic food-grade materials verified, clean sanitised studio.",
    },
  ];

  for (const prof of PROFILES) {
    await scriptDb
      .insert(kidsProviderProfiles)
      .values(prof)
      .onConflictDoUpdate({
        target: kidsProviderProfiles.vendorId,
        set: prof,
      });
    console.log("✓ Provider profile:", prof.vendorId);
  }

  // 4. Kids Services
  const SERVICES = [
    {
      vendorId: stemVendor.id,
      categoryId: "stem",
      title: "Junior LEGO Robotics & Mechanisms (Trial Class)",
      slug: "junior-lego-robotics-trial",
      description: "Build working motor-powered gears, pulleys, and mini robotic rovers in a small batch of 4-6 kids.",
      minAge: 5,
      maxAge: 11,
      suitableClasses: ["UKG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5"],
      durationMinutes: 60,
      deliveryModes: ["studio", "home"],
      pricePaise: 29900,
      materialFeePolicy: "included" as const,
      materialFeePaise: 0,
      isActive: true,
    },
    {
      vendorId: stemVendor.id,
      categoryId: "stem",
      title: "Scratch Arcade Game Coding & Animation",
      slug: "scratch-arcade-game-coding",
      description: "Interactive block-based coding to build classic retro games and character animations.",
      minAge: 7,
      maxAge: 11,
      suitableClasses: ["Class 2", "Class 3", "Class 4", "Class 5"],
      durationMinutes: 75,
      deliveryModes: ["studio", "online"],
      pricePaise: 49900,
      materialFeePolicy: "included" as const,
      materialFeePaise: 0,
      isActive: true,
    },
    {
      vendorId: chessVendor.id,
      categoryId: "life-skills",
      title: "1:1 Chess Diagnostic & Tactics Assessment",
      slug: "1on1-chess-diagnostic-assessment",
      description: "Personal 1:1 diagnostic with a rated coach to evaluate tactical vision, board awareness, and custom roadmapping.",
      minAge: 5,
      maxAge: 11,
      suitableClasses: ["UKG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5"],
      durationMinutes: 45,
      deliveryModes: ["studio", "home", "online"],
      pricePaise: 35000,
      materialFeePolicy: "included" as const,
      materialFeePaise: 0,
      isActive: true,
    },
    {
      vendorId: artVendor.id,
      categoryId: "art-craft",
      title: "Mess-Free Pottery Wheel & Clay Sculpting",
      slug: "mess-free-pottery-wheel-sculpting",
      description: "Shape bowls, mini vases, and cartoon animals on kid-safe electric wheels with non-toxic natural clay.",
      minAge: 4,
      maxAge: 11,
      suitableClasses: ["LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5"],
      durationMinutes: 60,
      deliveryModes: ["studio", "home"],
      pricePaise: 49900,
      materialFeePolicy: "included" as const,
      materialFeePaise: 0,
      isActive: true,
    },
    {
      vendorId: artVendor.id,
      categoryId: "academics",
      title: "Primary Handwriting & Phonics Homework Club",
      slug: "primary-handwriting-phonics-club",
      description: "Gentle, confidence-building coaching for neat cursive handwriting, spelling phonics, and school homework support.",
      minAge: 4,
      maxAge: 8,
      suitableClasses: ["LKG", "UKG", "Class 1", "Class 2"],
      durationMinutes: 60,
      deliveryModes: ["home", "studio"],
      pricePaise: 35000,
      materialFeePolicy: "included" as const,
      materialFeePaise: 0,
      isActive: true,
    },
  ];

  for (const s of SERVICES) {
    const [existing] = await scriptDb
      .select({ id: kidsServices.id })
      .from(kidsServices)
      .where(and(eq(kidsServices.vendorId, s.vendorId), eq(kidsServices.slug, s.slug)))
      .limit(1);

    if (!existing) {
      await scriptDb.insert(kidsServices).values(s);
      console.log("✓ Service:", s.title);
    }
  }

  // 5. Kids Workshops & Sessions
  const WORKSHOPS = [
    {
      vendorId: stemVendor.id,
      categoryId: "stem",
      title: "Weekend Mars Rover Robotics & Sensors Bootcamp",
      slug: "weekend-mars-rover-bootcamp",
      description: "Two-day weekend camp where kids assemble an obstacle-avoiding smart rover car with motors, ultrasonic distance sensors, and take it home!",
      eligibleAges: "Ages 6–11",
      minAge: 6,
      maxAge: 11,
      eligibleClasses: ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5"],
      startDate: "2026-10-24",
      endDate: "2026-10-25",
      enrollmentDeadline: new Date("2026-10-24T04:00:00Z"),
      venueOrMode: "RoboSparks Innovation Lab, Morabadi",
      address: "2nd Floor, Green View Tower, Morabadi, Ranchi",
      capacity: 8,
      pricePaise: 120000,
      materialsDescription: "Complete Mars Rover electronics kit, motor chassis, battery pack, and take-home project box.",
      publicationState: "published" as const,
      cancellationPolicy: "Full refund up to 24 hours before Day 1 starts.",
      sessions: [
        { sessionDate: "2026-10-24", startTime: "10:30", endTime: "12:30", sessionOrder: 1 },
        { sessionDate: "2026-10-25", startTime: "10:30", endTime: "12:30", sessionOrder: 2 },
      ],
    },
    {
      vendorId: artVendor.id,
      categoryId: "art-craft",
      title: "Sunday Terracotta Pottery Carnival & Ceramic Glazing",
      slug: "sunday-terracotta-pottery-carnival",
      description: "Hands-on pottery wheel workshop for kids to shape decorative clay tea-light holders, painted bowls, and cartoon figures.",
      eligibleAges: "Ages 4–11",
      minAge: 4,
      maxAge: 11,
      eligibleClasses: ["LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5"],
      startDate: "2026-10-25",
      endDate: "2026-10-25",
      enrollmentDeadline: new Date("2026-10-25T08:00:00Z"),
      venueOrMode: "Little Picassos Clay Studio, Kanke Road",
      address: "Plot 14, Near Rock Garden, Kanke Road, Ranchi",
      capacity: 6,
      pricePaise: 49900,
      materialsDescription: "Natural terracotta clay, ceramic paints, glazing finish, and protective aprons provided.",
      publicationState: "published" as const,
      cancellationPolicy: "Free cancellation up to 12 hours before session.",
      sessions: [
        { sessionDate: "2026-10-25", startTime: "16:00", endTime: "17:30", sessionOrder: 1 },
      ],
    },
  ];

  for (const ws of WORKSHOPS) {
    const { sessions, ...wsData } = ws;
    let [wsRow] = await scriptDb
      .select({ id: kidsWorkshops.id })
      .from(kidsWorkshops)
      .where(and(eq(kidsWorkshops.vendorId, ws.vendorId), eq(kidsWorkshops.slug, ws.slug)))
      .limit(1);

    if (!wsRow) {
      [wsRow] = await scriptDb.insert(kidsWorkshops).values(wsData).returning({ id: kidsWorkshops.id });
      console.log("✓ Workshop:", ws.title);

      for (const s of sessions) {
        await scriptDb.insert(kidsWorkshopSessions).values({
          workshopId: wsRow!.id,
          ...s,
        });
      }
    }
  }

  console.log("Kids Domain Seed Completed successfully!");
}

seedKidsDomain()
  .then(() => scriptPool.end())
  .catch((err) => {
    console.error(err);
    scriptPool.end();
    process.exit(1);
  });
