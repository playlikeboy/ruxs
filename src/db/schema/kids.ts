import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { vendors } from "./vendors";

/**
 * Categories specific to the Kids Activities & Learning marketplace.
 * Distinct from delivery categories (e.g. tiffin, water, milk).
 */
export const kidsCategories = pgTable(
  "kids_categories",
  {
    id: text("id").primaryKey(), // slug, e.g. "academics", "stem", "performing-arts", "art-craft", "life-skills", "holiday"
    name: text("name").notNull(),
    description: text("description"),
    emoji: text("emoji").notNull().default("🎈"),
    coverUrl: text("cover_url"),
    tint: text("tint").notNull().default("#FEF08A"),
    sort: integer("sort").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("kids_categories_sort_idx").on(t.sort)]
);

/**
 * Kids activities & learning services offered by verified providers.
 * Supports single sessions, recurring packs, and school project tutoring.
 */
export const kidsServices = pgTable(
  "kids_services",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => kidsCategories.id, { onUpdate: "cascade", onDelete: "restrict" }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    minAge: integer("min_age").notNull().default(3),
    maxAge: integer("max_age").notNull().default(11),
    suitableClasses: text("suitable_classes").array().notNull().default(sql`'{}'::text[]`), // e.g. Nursery, LKG, UKG, Class 1-5
    durationMinutes: integer("duration_minutes").notNull().default(60),
    deliveryModes: text("delivery_modes").array().notNull().default(sql`'{studio,home}'::text[]`), // home, studio, online
    pricePaise: integer("price_paise").notNull(),
    materialFeePolicy: text("material_fee_policy").notNull().default("included"), // included, extra, required
    materialFeePaise: integer("material_fee_paise").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("kids_services_vendor_idx").on(t.vendorId),
    index("kids_services_category_idx").on(t.categoryId),
    uniqueIndex("kids_services_vendor_slug_idx").on(t.vendorId, t.slug),
    check("kids_services_age_check", sql`${t.minAge} >= 3 and ${t.maxAge} <= 18 and ${t.minAge} <= ${t.maxAge}`),
    check("kids_services_duration_check", sql`${t.durationMinutes} between 15 and 480`),
    check("kids_services_price_check", sql`${t.pricePaise} >= 0`),
    check("kids_services_material_policy_check", sql`${t.materialFeePolicy} in ('included', 'extra', 'required')`),
  ]
);

/**
 * Child profiles owned by authenticated parents/guardians.
 * Scoped strictly to guardianUserId. Full date of birth is kept minimal and private.
 */
export const kidsChildren = pgTable(
  "kids_children",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    guardianUserId: text("guardian_user_id").notNull(),
    displayName: text("display_name").notNull(),
    birthDate: text("birth_date"), // YYYY-MM-DD or approximate birth date
    birthYear: integer("birth_year"),
    schoolClass: text("school_class"), // Nursery, KG, Class 1..5
    activityNotes: text("activity_notes"), // allergies, interests, learning style
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("kids_children_guardian_idx").on(t.guardianUserId)]
);

/**
 * Single-session or 1:1 service bookings for children.
 * Snapshots the service price and material fee at the moment of booking.
 */
export const kidsServiceBookings = pgTable(
  "kids_service_bookings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    number: text("number").notNull().unique(), // KBK-YYYYMM-XXXX
    clientKey: text("client_key").notNull().unique(), // idempotency for repeated submissions
    serviceId: text("service_id").references(() => kidsServices.id, { onDelete: "set null" }),
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    guardianUserId: text("guardian_user_id").notNull(),
    childId: text("child_id")
      .notNull()
      .references(() => kidsChildren.id, { onDelete: "restrict" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    deliveryMode: text("delivery_mode").notNull(), // home, studio, online
    address: text("address"),
    priceSnapshotPaise: integer("price_snapshot_paise").notNull(),
    materialFeeSnapshotPaise: integer("material_fee_snapshot_paise").notNull().default(0),
    paymentRef: text("payment_ref"),
    paymentStatus: text("payment_status").notNull().default("unpaid"), // unpaid, paid, refund_due, refunded, pass_redeemed
    bookingStatus: text("booking_status").notNull().default("confirmed"), // held, confirmed, completed, cancelled
    heldUntil: timestamp("held_until", { withTimezone: true }),
    cancellationReason: text("cancellation_reason"),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("kids_bookings_vendor_time_idx").on(t.vendorId, t.startsAt),
    index("kids_bookings_guardian_idx").on(t.guardianUserId, t.startsAt),
    index("kids_bookings_child_idx").on(t.childId),
    uniqueIndex("kids_bookings_vendor_start_active_idx")
      .on(t.vendorId, t.startsAt)
      .where(sql`${t.bookingStatus} in ('held', 'confirmed')`),
    check("kids_bookings_mode_check", sql`${t.deliveryMode} in ('home', 'studio', 'online')`),
    check("kids_bookings_status_check", sql`${t.bookingStatus} in ('held', 'confirmed', 'completed', 'cancelled')`),
    check("kids_bookings_payment_status_check", sql`${t.paymentStatus} in ('unpaid', 'paid', 'refund_due', 'refunded', 'pass_redeemed')`),
  ]
);

/**
 * Multi-session workshops, weekend camps and holiday activity bootcamps.
 */
export const kidsWorkshops = pgTable(
  "kids_workshops",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => kidsCategories.id, { onUpdate: "cascade", onDelete: "restrict" }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    eligibleAges: text("eligible_ages").notNull().default("Ages 5–11"),
    minAge: integer("min_age").notNull().default(5),
    maxAge: integer("max_age").notNull().default(11),
    eligibleClasses: text("eligible_classes").array().notNull().default(sql`'{}'::text[]`),
    startDate: text("start_date").notNull(), // YYYY-MM-DD
    endDate: text("end_date").notNull(), // YYYY-MM-DD
    enrollmentDeadline: timestamp("enrollment_deadline", { withTimezone: true }).notNull(),
    venueOrMode: text("venue_or_mode").notNull().default("studio"), // studio, online, outdoor
    address: text("address"),
    capacity: integer("capacity").notNull().default(10),
    pricePaise: integer("price_paise").notNull(),
    materialsDescription: text("materials_description"),
    publicationState: text("publication_state").notNull().default("published"), // draft, published, archived
    cancellationPolicy: text("cancellation_policy").notNull().default("Free cancellation up to 48 hours before camp start."),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("kids_workshops_vendor_idx").on(t.vendorId),
    index("kids_workshops_category_idx").on(t.categoryId),
    uniqueIndex("kids_workshops_vendor_slug_idx").on(t.vendorId, t.slug),
    check("kids_workshops_capacity_check", sql`${t.capacity} > 0`),
    check("kids_workshops_price_check", sql`${t.pricePaise} >= 0`),
    check("kids_workshops_state_check", sql`${t.publicationState} in ('draft', 'published', 'archived')`),
  ]
);

/**
 * Individual sessions for a workshop (e.g. Day 1, Day 2, Day 3 of a holiday camp).
 */
export const kidsWorkshopSessions = pgTable(
  "kids_workshop_sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workshopId: text("workshop_id")
      .notNull()
      .references(() => kidsWorkshops.id, { onDelete: "cascade" }),
    sessionDate: text("session_date").notNull(), // YYYY-MM-DD
    startTime: text("start_time").notNull(), // HH:MM
    endTime: text("end_time").notNull(), // HH:MM
    venueOrMode: text("venue_or_mode"),
    sessionOrder: integer("session_order").notNull().default(1),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("kids_workshop_sessions_workshop_idx").on(t.workshopId, t.sessionDate)]
);

/**
 * Child enrollments in workshops. Capacity is enforced with concurrency control.
 */
export const kidsWorkshopEnrollments = pgTable(
  "kids_workshop_enrollments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workshopId: text("workshop_id")
      .notNull()
      .references(() => kidsWorkshops.id, { onDelete: "restrict" }),
    childId: text("child_id")
      .notNull()
      .references(() => kidsChildren.id, { onDelete: "restrict" }),
    guardianUserId: text("guardian_user_id").notNull(),
    status: text("status").notNull().default("confirmed"), // pending, confirmed, cancelled, waitlisted
    priceSnapshotPaise: integer("price_snapshot_paise").notNull(),
    paymentStatus: text("payment_status").notNull().default("unpaid"), // unpaid, paid, refund_due, refunded, pass_redeemed
    paymentRef: text("payment_ref"),
    cancellationReason: text("cancellation_reason"),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("kids_enrollments_workshop_idx").on(t.workshopId),
    index("kids_enrollments_guardian_idx").on(t.guardianUserId),
    index("kids_enrollments_child_idx").on(t.childId),
    uniqueIndex("kids_enrollment_unique_active_idx")
      .on(t.workshopId, t.childId)
      .where(sql`${t.status} in ('pending', 'confirmed')`),
    check("kids_enrollments_status_check", sql`${t.status} in ('pending', 'confirmed', 'cancelled', 'waitlisted')`),
    check("kids_enrollments_payment_check", sql`${t.paymentStatus} in ('unpaid', 'paid', 'refund_due', 'refunded', 'pass_redeemed')`),
  ]
);

/**
 * Provider vetting and verification credentials for children's activities.
 * Admin audits and approves status.
 */
export const kidsProviderProfiles = pgTable(
  "kids_provider_profiles",
  {
    vendorId: text("vendor_id")
      .primaryKey()
      .references(() => vendors.id, { onDelete: "cascade" }),
    headline: text("headline"), // "M.Sc Physics & certified STEM educator"
    qualifications: text("qualifications"), // "B.Ed, Certified LEGO Education Instructor"
    experienceYears: integer("experience_years").notNull().default(0),
    specialties: text("specialties").array().notNull().default(sql`'{}'::text[]`),
    languages: text("languages").array().notNull().default(sql`'{}'::text[]`),
    ageGroupsServed: text("age_groups_served").array().notNull().default(sql`'{}'::text[]`),
    verificationStatus: text("verification_status").notNull().default("pending"), // pending, approved, rejected, suspended
    safetyReviewStatus: text("safety_review_status").notNull().default("pending"), // pending, passed, flagged
    verifiedByAdminId: text("verified_by_admin_id"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    safetyNotes: text("safety_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    check("kids_provider_verification_check", sql`${t.verificationStatus} in ('pending', 'approved', 'rejected', 'suspended')`),
    check("kids_provider_safety_check", sql`${t.safetyReviewStatus} in ('pending', 'passed', 'flagged')`),
  ]
);

/**
 * Optional or required material packages for classes (e.g. robotics board, clay kit).
 */
export const kidsMaterialPackages = pgTable(
  "kids_material_packages",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    serviceId: text("service_id").references(() => kidsServices.id, { onDelete: "cascade" }),
    workshopId: text("workshop_id").references(() => kidsWorkshops.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    pricePaise: integer("price_paise").notNull().default(0),
    policy: text("policy").notNull().default("optional"), // optional, included, required
    stock: integer("stock"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    check("kids_materials_price_check", sql`${t.pricePaise} >= 0`),
    check("kids_materials_policy_check", sql`${t.policy} in ('optional', 'included', 'required')`),
  ]
);

/**
 * Holiday activity & camp passes (multi-session credits).
 */
export const kidsHolidayPasses = pgTable(
  "kids_holiday_passes",
  {
    id: text("id").primaryKey(), // slug, e.g. "summer-stem-4x", "weekend-creative-6x"
    name: text("name").notNull(),
    description: text("description"),
    eligibleScope: text("eligible_scope").notNull().default("all"), // all, stem, arts, workshops
    creditsTotal: integer("credits_total").notNull(),
    pricePaise: integer("price_paise").notNull(),
    validityDays: integer("validity_days").notNull().default(30),
    terms: text("terms"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    check("kids_passes_credits_check", sql`${t.creditsTotal} > 0`),
    check("kids_passes_price_check", sql`${t.pricePaise} > 0`),
  ]
);

/**
 * Purchased passes owned by guardians. Balances are strictly updated server-side.
 */
export const kidsPassPurchases = pgTable(
  "kids_pass_purchases",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    guardianUserId: text("guardian_user_id").notNull(),
    passId: text("pass_id")
      .notNull()
      .references(() => kidsHolidayPasses.id, { onDelete: "restrict" }),
    purchasedCredits: integer("purchased_credits").notNull(),
    remainingCredits: integer("remaining_credits").notNull(),
    purchasePricePaise: integer("purchase_price_paise").notNull(),
    validFrom: timestamp("valid_from", { withTimezone: true }).notNull(),
    validUntil: timestamp("valid_until", { withTimezone: true }).notNull(),
    paymentRef: text("payment_ref"),
    paymentStatus: text("payment_status").notNull().default("paid"), // unpaid, paid, refunded
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("kids_pass_purchases_guardian_idx").on(t.guardianUserId),
    check("kids_pass_remaining_check", sql`${t.remainingCredits} >= 0 and ${t.remainingCredits} <= ${t.purchasedCredits}`),
    check("kids_pass_payment_check", sql`${t.paymentStatus} in ('unpaid', 'paid', 'refunded')`),
  ]
);

/**
 * Audit log of pass credit redemptions with idempotency and reversal protection.
 */
export const kidsPassRedemptions = pgTable(
  "kids_pass_redemptions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    purchaseId: text("purchase_id")
      .notNull()
      .references(() => kidsPassPurchases.id, { onDelete: "cascade" }),
    bookingId: text("booking_id").references(() => kidsServiceBookings.id, { onDelete: "set null" }),
    enrollmentId: text("enrollment_id").references(() => kidsWorkshopEnrollments.id, { onDelete: "set null" }),
    creditsConsumed: integer("credits_consumed").notNull().default(1),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    status: text("status").notNull().default("redeemed"), // redeemed, reversed
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("kids_redemptions_purchase_idx").on(t.purchaseId),
    check("kids_redemptions_status_check", sql`${t.status} in ('redeemed', 'reversed')`),
  ]
);

/**
 * Recorded guardian consents for safety policies and home session supervision.
 */
export const kidsSafetyConsents = pgTable(
  "kids_safety_consents",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    guardianUserId: text("guardian_user_id").notNull(),
    childId: text("child_id")
      .notNull()
      .references(() => kidsChildren.id, { onDelete: "cascade" }),
    policyVersion: text("policy_version").notNull().default("2026-v1"),
    consentType: text("consent_type").notNull(), // home_supervision, photo_waiver, emergency_medical, activity_participation
    acceptedAt: timestamp("accepted_at", { withTimezone: true }).defaultNow().notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    ipAddress: text("ip_address"),
  },
  (t) => [
    index("kids_consents_guardian_child_idx").on(t.guardianUserId, t.childId),
    check("kids_consent_type_check", sql`${t.consentType} in ('home_supervision', 'photo_waiver', 'emergency_medical', 'activity_participation')`),
  ]
);

/**
 * Reviews for kids activities, restricted to completed bookings and enrollments.
 */
export const kidsReviews = pgTable(
  "kids_reviews",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    guardianUserId: text("guardian_user_id").notNull(),
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    bookingId: text("booking_id").references(() => kidsServiceBookings.id, { onDelete: "set null" }),
    enrollmentId: text("enrollment_id").references(() => kidsWorkshopEnrollments.id, { onDelete: "set null" }),
    rating: integer("rating").notNull(),
    reviewText: text("review_text"),
    moderationStatus: text("moderation_status").notNull().default("published"), // pending, published, hidden, flagged
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("kids_reviews_vendor_idx").on(t.vendorId),
    uniqueIndex("kids_reviews_guardian_booking_uniq").on(t.guardianUserId, t.bookingId).where(sql`${t.bookingId} is not null`),
    uniqueIndex("kids_reviews_guardian_enrollment_uniq").on(t.guardianUserId, t.enrollmentId).where(sql`${t.enrollmentId} is not null`),
    check("kids_reviews_rating_check", sql`${t.rating} between 1 and 5`),
    check("kids_reviews_moderation_check", sql`${t.moderationStatus} in ('pending', 'published', 'hidden', 'flagged')`),
  ]
);
