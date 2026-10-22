import { sql } from "drizzle-orm";
import { pgTable, text, integer, boolean, timestamp, index, foreignKey } from "drizzle-orm/pg-core";
import { vendors } from "./vendors";
import { products } from "./catalog";
import { services } from "./bookings";

/*
 * One table per vendor type. Profile tables are 1:1 with vendors; item tables are
 * 1:1 with products (delivery types) or services (booking types). Database
 * triggers (migration 0013) reject rows for a vendor of another type, so a tiffin
 * kitchen can only ever have tiffin rows. Kids academies use kids_provider_profiles
 * and kids_services (see kids.ts).
 */

const updatedAt = () => timestamp("updated_at", { withTimezone: true }).defaultNow().notNull();
const vendorPk = () =>
  text("vendor_id")
    .primaryKey()
    .references(() => vendors.id, { onDelete: "cascade" });
const vendorRef = () =>
  text("vendor_id")
    .notNull()
    .references(() => vendors.id, { onDelete: "cascade" });
const emptyArray = sql`'{}'::text[]`;

// ── Profiles ────────────────────────────────────────────────────────────────

export const tiffinKitchens = pgTable("tiffin_kitchens", {
  vendorId: vendorPk(),
  diet: text("diet").notNull().default("veg"), // veg, jain, egg, non_veg, mixed
  cuisines: text("cuisines").array().notNull().default(emptyArray),
  mealSlots: text("meal_slots").array().notNull().default(sql`'{lunch,dinner}'::text[]`),
  weeklyOff: text("weekly_off").array().notNull().default(emptyArray), // mon..sun
  trialMealPaise: integer("trial_meal_paise"),
  dabbaType: text("dabba_type").notNull().default("steel"), // steel, disposable, eco
  fssaiNumber: text("fssai_number"),
  updatedAt: updatedAt(),
});

export const waterSuppliers = pgTable("water_suppliers", {
  vendorId: vendorPk(),
  waterSource: text("water_source").notNull().default("ro"), // ro, mineral, spring, alkaline
  brands: text("brands").array().notNull().default(emptyArray),
  tdsPpm: integer("tds_ppm"),
  bisLicense: text("bis_license"),
  upperFloorDelivery: boolean("upper_floor_delivery").notNull().default(true),
  sameDayDelivery: boolean("same_day_delivery").notNull().default(true),
  updatedAt: updatedAt(),
});

export const dairyFarms = pgTable("dairy_farms", {
  vendorId: vendorPk(),
  source: text("source").notNull().default("own_farm"), // own_farm, cooperative, brand, collection_centre
  animals: text("animals").array().notNull().default(sql`'{cow}'::text[]`),
  packaging: text("packaging").notNull().default("pouch"), // pouch, glass_bottle, can, loose
  morningDeliveryBy: text("morning_delivery_by").notNull().default("07:00"),
  eveningDelivery: boolean("evening_delivery").notNull().default(false),
  fssaiNumber: text("fssai_number"),
  updatedAt: updatedAt(),
});

export const giftStudios = pgTable("gift_studios", {
  vendorId: vendorPk(),
  occasions: text("occasions").array().notNull().default(emptyArray),
  customisation: boolean("customisation").notNull().default(true),
  minLeadDays: integer("min_lead_days").notNull().default(1),
  giftWrapPaise: integer("gift_wrap_paise").notNull().default(0),
  shipsOutsideCity: boolean("ships_outside_city").notNull().default(false),
  updatedAt: updatedAt(),
});

export const retailStores = pgTable("retail_stores", {
  vendorId: vendorPk(),
  storeKind: text("store_kind").notNull().default("general"), // general, grocery, stationery, kids_kits, pharmacy, other
  gstin: text("gstin"),
  opensAt: text("opens_at"), // "08:00"
  closesAt: text("closes_at"),
  updatedAt: updatedAt(),
});

export const fitnessTrainers = pgTable("fitness_trainers", {
  vendorId: vendorPk(),
  headline: text("headline"),
  certifications: text("certifications"),
  experienceYears: integer("experience_years"),
  specialities: text("specialities").array().notNull().default(emptyArray),
  languages: text("languages").array().notNull().default(emptyArray),
  gender: text("gender"),
  gymName: text("gym_name"),
  gymAddress: text("gym_address"),
  womenOnlySlots: boolean("women_only_slots").notNull().default(false),
  updatedAt: updatedAt(),
});

export const physioClinics = pgTable("physio_clinics", {
  vendorId: vendorPk(),
  headline: text("headline"),
  qualifications: text("qualifications"),
  registrationNumber: text("registration_number"), // state council / IAP number
  experienceYears: integer("experience_years"),
  specialities: text("specialities").array().notNull().default(emptyArray),
  conditionsTreated: text("conditions_treated").array().notNull().default(emptyArray),
  languages: text("languages").array().notNull().default(emptyArray),
  gender: text("gender"),
  clinicName: text("clinic_name"),
  clinicAddress: text("clinic_address"),
  homeVisits: boolean("home_visits").notNull().default(true),
  homeVisitFeePaise: integer("home_visit_fee_paise").notNull().default(0),
  updatedAt: updatedAt(),
});

export const mehndiArtists = pgTable("mehndi_artists", {
  vendorId: vendorPk(),
  headline: text("headline"),
  experienceYears: integer("experience_years"),
  styles: text("styles").array().notNull().default(emptyArray),
  languages: text("languages").array().notNull().default(emptyArray),
  gender: text("gender"),
  organicHenna: boolean("organic_henna").notNull().default(true),
  teamSize: integer("team_size").notNull().default(1),
  travelFeePaise: integer("travel_fee_paise").notNull().default(0),
  bridalAdvanceDays: integer("bridal_advance_days").notNull().default(7),
  portfolioUrl: text("portfolio_url"),
  updatedAt: updatedAt(),
});

// ── Items ───────────────────────────────────────────────────────────────────

export const tiffinMeals = pgTable(
  "tiffin_meals",
  {
    productId: text("product_id").primaryKey(),
    vendorId: vendorRef(),
    mealType: text("meal_type").notNull().default("lunch"), // breakfast, lunch, dinner, snacks
    diet: text("diet").notNull().default("veg"), // veg, jain, egg, non_veg
    cuisine: text("cuisine"),
    itemsIncluded: text("items_included"), // "4 roti, dal, sabzi, rice, salad"
    spiceLevel: text("spice_level").notNull().default("medium"), // mild, medium, spicy
    calories: integer("calories"),
    updatedAt: updatedAt(),
  },
  (t) => [
    foreignKey({ columns: [t.productId, t.vendorId], foreignColumns: [products.id, products.vendorId] }).onDelete("cascade"),
    index("tiffin_meals_vendor_idx").on(t.vendorId),
  ]
);

export const waterCans = pgTable(
  "water_cans",
  {
    productId: text("product_id").primaryKey(),
    vendorId: vendorRef(),
    volumeMl: integer("volume_ml").notNull().default(20000),
    packSize: integer("pack_size").notNull().default(1),
    container: text("container").notNull().default("can"), // can, jar, bottle_pack, dispenser
    returnable: boolean("returnable").notNull().default(false),
    chilled: boolean("chilled").notNull().default(false),
    brand: text("brand"),
    updatedAt: updatedAt(),
  },
  (t) => [
    foreignKey({ columns: [t.productId, t.vendorId], foreignColumns: [products.id, products.vendorId] }).onDelete("cascade"),
    index("water_cans_vendor_idx").on(t.vendorId),
  ]
);

export const dairyItems = pgTable(
  "dairy_items",
  {
    productId: text("product_id").primaryKey(),
    vendorId: vendorRef(),
    itemType: text("item_type").notNull().default("milk"), // milk, curd, paneer, ghee, butter, buttermilk, other
    animal: text("animal"), // cow, buffalo, a2_cow, goat, mixed
    quantity: integer("quantity"),
    unit: text("unit").notNull().default("ml"), // ml, l, g, kg, pcs
    fatPercentX10: integer("fat_percent_x10"), // 4.5% = 45
    packaging: text("packaging").notNull().default("pouch"),
    updatedAt: updatedAt(),
  },
  (t) => [
    foreignKey({ columns: [t.productId, t.vendorId], foreignColumns: [products.id, products.vendorId] }).onDelete("cascade"),
    index("dairy_items_vendor_idx").on(t.vendorId),
  ]
);

export const giftItems = pgTable(
  "gift_items",
  {
    productId: text("product_id").primaryKey(),
    vendorId: vendorRef(),
    occasion: text("occasion"),
    customisable: boolean("customisable").notNull().default(false),
    personalisationHint: text("personalisation_hint"), // "Name and date, up to 20 letters"
    leadDays: integer("lead_days").notNull().default(1),
    giftWrap: boolean("gift_wrap").notNull().default(true),
    updatedAt: updatedAt(),
  },
  (t) => [
    foreignKey({ columns: [t.productId, t.vendorId], foreignColumns: [products.id, products.vendorId] }).onDelete("cascade"),
    index("gift_items_vendor_idx").on(t.vendorId),
  ]
);

export const fitnessPackages = pgTable(
  "fitness_packages",
  {
    serviceId: text("service_id").primaryKey(),
    vendorId: vendorRef(),
    packageType: text("package_type").notNull().default("single"), // trial, single, pack, monthly
    sessionsIncluded: integer("sessions_included").notNull().default(1),
    validityDays: integer("validity_days"),
    level: text("level").notNull().default("all"), // beginner, intermediate, advanced, all
    focus: text("focus"),
    updatedAt: updatedAt(),
  },
  (t) => [
    foreignKey({ columns: [t.serviceId, t.vendorId], foreignColumns: [services.id, services.vendorId] }).onDelete("cascade"),
    index("fitness_packages_vendor_idx").on(t.vendorId),
  ]
);

export const physioTreatments = pgTable(
  "physio_treatments",
  {
    serviceId: text("service_id").primaryKey(),
    vendorId: vendorRef(),
    treatmentType: text("treatment_type").notNull().default("session"), // assessment, session, package, consultation
    conditions: text("conditions").array().notNull().default(emptyArray),
    sessionsIncluded: integer("sessions_included").notNull().default(1),
    equipment: text("equipment"),
    requiresPrescription: boolean("requires_prescription").notNull().default(false),
    updatedAt: updatedAt(),
  },
  (t) => [
    foreignKey({ columns: [t.serviceId, t.vendorId], foreignColumns: [services.id, services.vendorId] }).onDelete("cascade"),
    index("physio_treatments_vendor_idx").on(t.vendorId),
  ]
);

export const mehndiPackages = pgTable(
  "mehndi_packages",
  {
    serviceId: text("service_id").primaryKey(),
    vendorId: vendorRef(),
    style: text("style").notNull().default("arabic"), // bridal, arabic, rajasthani, indo_western, minimal, kids, other
    coverage: text("coverage").notNull().default("both_hands"), // per_hand, both_hands, hands_and_feet, full_bridal
    peopleIncluded: integer("people_included").notNull().default(1),
    organic: boolean("organic").notNull().default(true),
    updatedAt: updatedAt(),
  },
  (t) => [
    foreignKey({ columns: [t.serviceId, t.vendorId], foreignColumns: [services.id, services.vendorId] }).onDelete("cascade"),
    index("mehndi_packages_vendor_idx").on(t.vendorId),
  ]
);

// ── 10 Differentiated Kids Vendor Profiles ──────────────────────────────────

export const kidsAcademicsProfiles = pgTable("kids_academics_profiles", {
  vendorId: vendorPk(),
  headline: text("headline"),
  qualifications: text("qualifications"),
  experienceYears: integer("experience_years").notNull().default(0),
  subjects: text("subjects").array().notNull().default(emptyArray),
  targetClasses: text("target_classes").array().notNull().default(emptyArray),
  board: text("board").notNull().default("all"),
  homeTuitionAvailable: boolean("home_tuition_available").notNull().default(true),
  guardianSupervisionRequired: boolean("guardian_supervision_required").notNull().default(true),
  idProofVerified: boolean("id_proof_verified").notNull().default(false),
  policeVerification: boolean("police_verification").notNull().default(false),
  certificates: text("certificates").array().notNull().default(emptyArray),
  galleryImages: text("gallery_images").array().notNull().default(emptyArray),
  previewVideoUrl: text("preview_video_url"),
  updatedAt: updatedAt(),
});

export const kidsStemProfiles = pgTable("kids_stem_profiles", {
  vendorId: vendorPk(),
  headline: text("headline"),
  qualifications: text("qualifications"),
  experienceYears: integer("experience_years").notNull().default(0),
  disciplines: text("disciplines").array().notNull().default(emptyArray),
  toolsUsed: text("tools_used").array().notNull().default(emptyArray),
  kitProvided: boolean("kit_provided").notNull().default(true),
  labEquipped: boolean("lab_equipped").notNull().default(false),
  homeTuitionAvailable: boolean("home_tuition_available").notNull().default(true),
  guardianSupervisionRequired: boolean("guardian_supervision_required").notNull().default(true),
  certificates: text("certificates").array().notNull().default(emptyArray),
  galleryImages: text("gallery_images").array().notNull().default(emptyArray),
  previewVideoUrl: text("preview_video_url"),
  updatedAt: updatedAt(),
});

export const kidsPerformingArtsProfiles = pgTable("kids_performing_arts_profiles", {
  vendorId: vendorPk(),
  headline: text("headline"),
  qualifications: text("qualifications"),
  experienceYears: integer("experience_years").notNull().default(0),
  artForms: text("art_forms").array().notNull().default(emptyArray),
  danceStyles: text("dance_styles").array().notNull().default(emptyArray),
  instruments: text("instruments").array().notNull().default(emptyArray),
  stageExperienceYears: integer("stage_experience_years").notNull().default(0),
  homeTuitionAvailable: boolean("home_tuition_available").notNull().default(true),
  guardianSupervisionRequired: boolean("guardian_supervision_required").notNull().default(true),
  auditionPrep: boolean("audition_prep").notNull().default(false),
  certificates: text("certificates").array().notNull().default(emptyArray),
  galleryImages: text("gallery_images").array().notNull().default(emptyArray),
  previewVideoUrl: text("preview_video_url"),
  updatedAt: updatedAt(),
});

export const kidsArtsCraftsProfiles = pgTable("kids_arts_crafts_profiles", {
  vendorId: vendorPk(),
  headline: text("headline"),
  qualifications: text("qualifications"),
  experienceYears: integer("experience_years").notNull().default(0),
  craftMediums: text("craft_mediums").array().notNull().default(emptyArray),
  materialsIncluded: boolean("materials_included").notNull().default(true),
  exhibitionsHeld: integer("exhibitions_held").notNull().default(0),
  homeTuitionAvailable: boolean("home_tuition_available").notNull().default(true),
  guardianSupervisionRequired: boolean("guardian_supervision_required").notNull().default(true),
  certificates: text("certificates").array().notNull().default(emptyArray),
  galleryImages: text("gallery_images").array().notNull().default(emptyArray),
  previewVideoUrl: text("preview_video_url"),
  updatedAt: updatedAt(),
});

export const kidsSchoolProjectsProfiles = pgTable("kids_school_projects_profiles", {
  vendorId: vendorPk(),
  headline: text("headline"),
  qualifications: text("qualifications"),
  experienceYears: integer("experience_years").notNull().default(0),
  projectCategories: text("project_categories").array().notNull().default(emptyArray),
  turnaroundDays: integer("turnaround_days").notNull().default(3),
  customModels: boolean("custom_models").notNull().default(true),
  expressDelivery: boolean("express_delivery").notNull().default(false),
  certificates: text("certificates").array().notNull().default(emptyArray),
  galleryImages: text("gallery_images").array().notNull().default(emptyArray),
  sampleProjectsVideoUrl: text("sample_projects_video_url"),
  previewVideoUrl: text("preview_video_url"),
  updatedAt: updatedAt(),
});

export const kidsCampsProfiles = pgTable("kids_camps_profiles", {
  vendorId: vendorPk(),
  headline: text("headline"),
  qualifications: text("qualifications"),
  experienceYears: integer("experience_years").notNull().default(0),
  campThemes: text("camp_themes").array().notNull().default(emptyArray),
  minAge: integer("min_age").notNull().default(4),
  maxAge: integer("max_age").notNull().default(14),
  batchCapacity: integer("batch_capacity").notNull().default(15),
  firstAidCertified: boolean("first_aid_certified").notNull().default(true),
  venueAddress: text("venue_address"),
  certificates: text("certificates").array().notNull().default(emptyArray),
  galleryImages: text("gallery_images").array().notNull().default(emptyArray),
  previewVideoUrl: text("preview_video_url"),
  updatedAt: updatedAt(),
});

export const kidsSportsFitnessProfiles = pgTable("kids_sports_fitness_profiles", {
  vendorId: vendorPk(),
  headline: text("headline"),
  qualifications: text("qualifications"),
  experienceYears: integer("experience_years").notNull().default(0),
  activityTypes: text("activity_types").array().notNull().default(emptyArray),
  fideRating: integer("fide_rating"),
  coachingLevel: text("coaching_level").notNull().default("all"),
  equipmentProvided: boolean("equipment_provided").notNull().default(true),
  homeTuitionAvailable: boolean("home_tuition_available").notNull().default(false),
  guardianSupervisionRequired: boolean("guardian_supervision_required").notNull().default(true),
  certificates: text("certificates").array().notNull().default(emptyArray),
  galleryImages: text("gallery_images").array().notNull().default(emptyArray),
  previewVideoUrl: text("preview_video_url"),
  updatedAt: updatedAt(),
});

export const kidsLifeSkillsProfiles = pgTable("kids_life_skills_profiles", {
  vendorId: vendorPk(),
  headline: text("headline"),
  qualifications: text("qualifications"),
  experienceYears: integer("experience_years").notNull().default(0),
  skillDomains: text("skill_domains").array().notNull().default(emptyArray),
  interactiveSessions: boolean("interactive_sessions").notNull().default(true),
  certificates: text("certificates").array().notNull().default(emptyArray),
  galleryImages: text("gallery_images").array().notNull().default(emptyArray),
  previewVideoUrl: text("preview_video_url"),
  updatedAt: updatedAt(),
});

export const kidsProductsProfiles = pgTable("kids_products_profiles", {
  vendorId: vendorPk(),
  storeKind: text("store_kind").notNull().default("kids_kits"),
  productKinds: text("product_kinds").array().notNull().default(emptyArray),
  rentalAvailable: boolean("rental_available").notNull().default(false),
  nonToxicCertified: boolean("non_toxic_certified").notNull().default(true),
  gstin: text("gstin"),
  certificates: text("certificates").array().notNull().default(emptyArray),
  galleryImages: text("gallery_images").array().notNull().default(emptyArray),
  previewVideoUrl: text("preview_video_url"),
  updatedAt: updatedAt(),
});

export const kidsInstitutionsProfiles = pgTable("kids_institutions_profiles", {
  vendorId: vendorPk(),
  headline: text("headline"),
  institutionType: text("institution_type").notNull().default("academy"),
  registrationNumber: text("registration_number"),
  campusSqft: integer("campus_sqft"),
  cctvMonitored: boolean("cctv_monitored").notNull().default(true),
  studentTeacherRatio: text("student_teacher_ratio"),
  certifiedStaffCount: integer("certified_staff_count").notNull().default(3),
  certificates: text("certificates").array().notNull().default(emptyArray),
  galleryImages: text("gallery_images").array().notNull().default(emptyArray),
  previewVideoUrl: text("preview_video_url"),
  updatedAt: updatedAt(),
});

// ── 10 Differentiated Kids Item Tables ──────────────────────────────────────

export const kidsAcademicsItems = pgTable(
  "kids_academics_items",
  {
    serviceId: text("service_id").primaryKey(),
    vendorId: vendorRef(),
    subject: text("subject"),
    gradeLevel: text("grade_level"),
    batchOr1on1: text("batch_or_1on1").notNull().default("1on1"),
    syllabusBoard: text("syllabus_board").notNull().default("cbse"),
    trialAvailable: boolean("trial_available").notNull().default(true),
    posterUrl: text("poster_url"),
    videoUrl: text("video_url"),
    updatedAt: updatedAt(),
  },
  (t) => [
    foreignKey({ columns: [t.serviceId, t.vendorId], foreignColumns: [services.id, services.vendorId] }).onDelete("cascade"),
    index("kids_academics_items_vendor_idx").on(t.vendorId),
  ]
);

export const kidsStemItems = pgTable(
  "kids_stem_items",
  {
    serviceId: text("service_id").primaryKey(),
    vendorId: vendorRef(),
    topic: text("topic"),
    hardwareIncluded: boolean("hardware_included").notNull().default(true),
    softwareRequired: text("software_required"),
    handsOnRatio: integer("hands_on_ratio").notNull().default(70),
    posterUrl: text("poster_url"),
    videoUrl: text("video_url"),
    updatedAt: updatedAt(),
  },
  (t) => [
    foreignKey({ columns: [t.serviceId, t.vendorId], foreignColumns: [services.id, services.vendorId] }).onDelete("cascade"),
    index("kids_stem_items_vendor_idx").on(t.vendorId),
  ]
);

export const kidsPerformingArtsItems = pgTable(
  "kids_performing_arts_items",
  {
    serviceId: text("service_id").primaryKey(),
    vendorId: vendorRef(),
    genreStyle: text("genre_style"),
    instrumentNeeded: text("instrument_needed"),
    skillLevel: text("skill_level").notNull().default("all"),
    recitalIncluded: boolean("recital_included").notNull().default(false),
    posterUrl: text("poster_url"),
    videoUrl: text("video_url"),
    updatedAt: updatedAt(),
  },
  (t) => [
    foreignKey({ columns: [t.serviceId, t.vendorId], foreignColumns: [services.id, services.vendorId] }).onDelete("cascade"),
    index("kids_performing_arts_items_vendor_idx").on(t.vendorId),
  ]
);

export const kidsArtsCraftsItems = pgTable(
  "kids_arts_crafts_items",
  {
    serviceId: text("service_id").primaryKey(),
    vendorId: vendorRef(),
    medium: text("medium"),
    materialsList: text("materials_list"),
    takeHomeKeepsake: boolean("take_home_keepsake").notNull().default(true),
    posterUrl: text("poster_url"),
    videoUrl: text("video_url"),
    updatedAt: updatedAt(),
  },
  (t) => [
    foreignKey({ columns: [t.serviceId, t.vendorId], foreignColumns: [services.id, services.vendorId] }).onDelete("cascade"),
    index("kids_arts_crafts_items_vendor_idx").on(t.vendorId),
  ]
);

export const kidsSchoolProjectsItems = pgTable(
  "kids_school_projects_items",
  {
    serviceId: text("service_id").primaryKey(),
    vendorId: vendorRef(),
    targetStandard: text("target_standard"),
    subjectDomain: text("subject_domain"),
    modelDimensions: text("model_dimensions"),
    diyGuideIncluded: boolean("diy_guide_included").notNull().default(true),
    posterUrl: text("poster_url"),
    videoUrl: text("video_url"),
    updatedAt: updatedAt(),
  },
  (t) => [
    foreignKey({ columns: [t.serviceId, t.vendorId], foreignColumns: [services.id, services.vendorId] }).onDelete("cascade"),
    index("kids_school_projects_items_vendor_idx").on(t.vendorId),
  ]
);

export const kidsCampsItems = pgTable(
  "kids_camps_items",
  {
    serviceId: text("service_id").primaryKey(),
    vendorId: vendorRef(),
    dailySchedule: text("daily_schedule"),
    mealsIncluded: boolean("meals_included").notNull().default(false),
    fieldTripsIncluded: boolean("field_trips_included").notNull().default(false),
    parentShowcaseDate: text("parent_showcase_date"),
    posterUrl: text("poster_url"),
    videoUrl: text("video_url"),
    updatedAt: updatedAt(),
  },
  (t) => [
    foreignKey({ columns: [t.serviceId, t.vendorId], foreignColumns: [services.id, services.vendorId] }).onDelete("cascade"),
    index("kids_camps_items_vendor_idx").on(t.vendorId),
  ]
);

export const kidsSportsFitnessItems = pgTable(
  "kids_sports_fitness_items",
  {
    serviceId: text("service_id").primaryKey(),
    vendorId: vendorRef(),
    sportType: text("sport_type"),
    difficultyLevel: text("difficulty_level").notNull().default("all"),
    gearRequired: text("gear_required"),
    physicalIntensity: text("physical_intensity").notNull().default("moderate"),
    posterUrl: text("poster_url"),
    videoUrl: text("video_url"),
    updatedAt: updatedAt(),
  },
  (t) => [
    foreignKey({ columns: [t.serviceId, t.vendorId], foreignColumns: [services.id, services.vendorId] }).onDelete("cascade"),
    index("kids_sports_fitness_items_vendor_idx").on(t.vendorId),
  ]
);

export const kidsLifeSkillsItems = pgTable(
  "kids_life_skills_items",
  {
    serviceId: text("service_id").primaryKey(),
    vendorId: vendorRef(),
    skillFocus: text("skill_focus"),
    prerequisites: text("prerequisites"),
    takeHomeProject: boolean("take_home_project").notNull().default(true),
    posterUrl: text("poster_url"),
    videoUrl: text("video_url"),
    updatedAt: updatedAt(),
  },
  (t) => [
    foreignKey({ columns: [t.serviceId, t.vendorId], foreignColumns: [services.id, services.vendorId] }).onDelete("cascade"),
    index("kids_life_skills_items_vendor_idx").on(t.vendorId),
  ]
);

export const kidsProductsItems = pgTable(
  "kids_products_items",
  {
    productId: text("product_id").primaryKey(),
    vendorId: vendorRef(),
    recommendedAge: text("recommended_age"),
    safetyCertified: boolean("safety_certified").notNull().default(true),
    boxContents: text("box_contents"),
    diyManualIncluded: boolean("diy_manual_included").notNull().default(true),
    rentalDepositPaise: integer("rental_deposit_paise").notNull().default(0),
    posterUrl: text("poster_url"),
    videoUrl: text("video_url"),
    updatedAt: updatedAt(),
  },
  (t) => [
    foreignKey({ columns: [t.productId, t.vendorId], foreignColumns: [products.id, products.vendorId] }).onDelete("cascade"),
    index("kids_products_items_vendor_idx").on(t.vendorId),
  ]
);

export const kidsInstitutionsItems = pgTable(
  "kids_institutions_items",
  {
    serviceId: text("service_id").primaryKey(),
    vendorId: vendorRef(),
    ageBracket: text("age_bracket"),
    batchTiming: text("batch_timing"),
    facilitiesIncluded: text("facilities_included").array().notNull().default(emptyArray),
    parentObservationAllowed: boolean("parent_observation_allowed").notNull().default(true),
    posterUrl: text("poster_url"),
    videoUrl: text("video_url"),
    updatedAt: updatedAt(),
  },
  (t) => [
    foreignKey({ columns: [t.serviceId, t.vendorId], foreignColumns: [services.id, services.vendorId] }).onDelete("cascade"),
    index("kids_institutions_items_vendor_idx").on(t.vendorId),
  ]
);
