"use server";

import { notifyAfter, notifyVendorAfter } from "@/features/notifications/dispatch";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { and, eq, gt, isNull, lt, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { availabilityBlocks, availabilityRules, bookings, categories, services, vendors } from "@/db/schema";
import { requireUser, requireVendorAccess } from "@/lib/auth/session";
import { canCancelBooking, isValidRule, openSlots, rulesOverlap } from "@/core/booking";
import { allowedCategoryIds, canUseModule, toVendorType } from "@/core/vendor-types";
import { hasItemTable, provisionItemDetails } from "@/features/vendor-types/tables";
import { rupeesToPaise } from "@/core/money";
import { todayIST } from "@/core/time";
import { addressLine, deliveryCheck, ensureCustomer, loadProfile } from "@/features/consumer/household";
import { getBookableService } from "./queries";
import {
  availabilitySchema,
  bookingIdSchema,
  bookingRulesSchema,
  bookSessionSchema,
  markBookingSchema,
  removeTimeOffSchema,
  saveServiceSchema,
  serviceIdSchema,
  timeOffSchema,
} from "./schemas";

const HOLD_MINUTES = 15;

function fail(error: string) {
  return { ok: false as const, error };
}

function bookingNumber(date: string): string {
  return `BK-${date.slice(5, 7)}${date.slice(8, 10)}-${crypto.randomBytes(3).toString("hex").slice(0, 5).toUpperCase()}`;
}

function revalidateProvider(slug: string) {
  revalidatePath(`/merchant-panel/${slug}`, "layout");
  revalidatePath(`/app/store/${slug}`);
}

/** Book one session. Online payment holds the slot for 15 minutes until Razorpay confirms. */
export async function bookSession(input: unknown) {
  const parsed = bookSessionSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid booking");

  const user = await requireUser();
  const profile = await loadProfile(user.id);
  if (!profile) return fail("Add your address and phone before booking");
  const data = parsed.data;
  const db = getDb();

  const [already] = await db.select({ id: bookings.id, userId: bookings.userId }).from(bookings).where(eq(bookings.clientKey, data.clientKey)).limit(1);
  if (already) return already.userId === user.id ? { ok: true as const, bookingId: already.id } : fail("Please try again");

  const found = await getBookableService(data.serviceId);
  if (!found) return fail("This service is not available right now");
  const { service, vendor } = found;
  if (!vendor.acceptingOrders) return fail(`${vendor.name} is not taking bookings right now`);
  if (!service.modes.includes(data.mode)) return fail("Pick a session type this service offers");
  if (data.mode === "home") {
    const outOfArea = await deliveryCheck(vendor, profile);
    if (outOfArea) {
      return fail(outOfArea.startsWith("Set") ? outOfArea : "This provider doesn't do home visits at your address. Try a studio or online session.");
    }
  }

  const startsAt = new Date(data.startsAt);
  const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);
  const date = todayIST(startsAt);
  const now = new Date();
  const online = data.paymentMode === "online";
  const number = bookingNumber(date);

  try {
    const bookingId = await db.transaction(async (tx) => {
      // One booking at a time per provider, so two people can't take the same slot.
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${vendor.id}))`);

      // Release unpaid holds that ran out.
      await tx
        .update(bookings)
        .set({ status: "cancelled", cancelReason: "Payment not completed in time", updatedAt: now })
        .where(and(eq(bookings.vendorId, vendor.id), eq(bookings.status, "held"), lt(bookings.heldUntil, now)));

      // Re-check the slot against the provider's hours, time off and live bookings.
      const [rules, blocks, taken] = await Promise.all([
        tx.select().from(availabilityRules).where(eq(availabilityRules.vendorId, vendor.id)),
        tx
          .select({ startsAt: availabilityBlocks.startsAt, endsAt: availabilityBlocks.endsAt })
          .from(availabilityBlocks)
          .where(and(eq(availabilityBlocks.vendorId, vendor.id), lt(availabilityBlocks.startsAt, endsAt), gt(availabilityBlocks.endsAt, startsAt))),
        tx
          .select({ startsAt: bookings.startsAt, endsAt: bookings.endsAt })
          .from(bookings)
          .where(
            and(
              eq(bookings.vendorId, vendor.id),
              or(eq(bookings.status, "confirmed"), and(eq(bookings.status, "held"), gt(bookings.heldUntil, now))),
              lt(bookings.startsAt, endsAt),
              gt(bookings.endsAt, startsAt)
            )
          ),
      ]);
      const free = openSlots({ date, rules, busy: [...blocks, ...taken], durationMinutes: service.durationMinutes, noticeMinutes: vendor.bookingNoticeMinutes, now });
      if (!free.some((s) => s.getTime() === startsAt.getTime())) throw new Error("SLOT_TAKEN");

      const customerId = await ensureCustomer(tx, vendor.id, profile);
      const [created] = await tx
        .insert(bookings)
        .values({
          number,
          clientKey: data.clientKey,
          vendorId: vendor.id,
          customerId,
          userId: user.id,
          serviceId: service.id,
          startsAt,
          endsAt,
          mode: data.mode,
          address: data.mode === "home" ? addressLine(profile) : null,
          pricePaise: service.pricePaise,
          paymentMode: data.paymentMode,
          paymentStatus: "unpaid",
          notes: data.notes || null,
          status: online ? "held" : "confirmed",
          heldUntil: online ? new Date(now.getTime() + HOLD_MINUTES * 60_000) : null,
        })
        .returning({ id: bookings.id });
      return created!.id;
    });

    revalidateProvider(vendor.slug);
    revalidatePath("/app/bookings");
    // Online bookings are announced once payment settles (payments/settle.ts).
    if (!online) {
      notifyAfter([user.id], { kind: "customer.booking.confirmed", number, serviceName: service.name, vendorName: vendor.name, startsAt });
      notifyVendorAfter(vendor.id, { kind: "vendor.booking.new", slug: vendor.slug, number, customerName: profile.name, serviceName: service.name, startsAt });
    }
    return { ok: true as const, bookingId };
  } catch (err) {
    if (err instanceof Error && err.message === "SLOT_TAKEN") return fail("That time was just taken. Pick another slot.");
    if (err instanceof Error && err.message === "PHONE_LINKED_ELSEWHERE") return fail("Your phone number is linked to another account with this provider.");
    return fail("Could not book. Please try again.");
  }
}

/** Household cancels before the provider's cutoff. Paid sessions become a refund for admin. */
export async function cancelMyBooking(input: unknown) {
  const parsed = bookingIdSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid booking");
  const user = await requireUser();
  const db = getDb();
  const [row] = await db
    .select({ booking: bookings, cutoff: vendors.cancelCutoffHours, slug: vendors.slug, serviceName: services.name })
    .from(bookings)
    .innerJoin(vendors, eq(bookings.vendorId, vendors.id))
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .where(and(eq(bookings.id, parsed.data.bookingId), eq(bookings.userId, user.id)))
    .limit(1);
  if (!row) return fail("Booking not found");
  if (!["held", "confirmed"].includes(row.booking.status)) return fail("This session can't be cancelled");
  if (row.booking.status === "confirmed" && !canCancelBooking(row.booking.startsAt, new Date(), row.cutoff)) {
    return fail(`Sessions can be cancelled up to ${row.cutoff} hours before they start`);
  }
  const [updated] = await db
    .update(bookings)
    .set({
      status: "cancelled",
      cancelReason: "Cancelled by you",
      ...(row.booking.paymentStatus === "paid" ? { paymentStatus: "refund_due" } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(bookings.id, row.booking.id), eq(bookings.status, row.booking.status)))
    .returning({ id: bookings.id });
  if (!updated) return fail("This session just changed. Refresh and try again.");
  revalidatePath("/app/bookings");
  revalidatePath(`/app/bookings/${row.booking.id}`);
  revalidateProvider(row.slug);
  if (row.booking.status === "confirmed") {
    notifyVendorAfter(row.booking.vendorId, {
      kind: "vendor.booking.cancelled",
      slug: row.slug,
      number: row.booking.number,
      customerName: "A client",
      serviceName: row.serviceName ?? "Session",
      startsAt: row.booking.startsAt,
    });
  }
  return { ok: true as const };
}

/** Provider closes a session: done or no-show release online money to earnings; cancel refunds it. */
export async function markBooking(input: unknown) {
  const parsed = markBookingSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid input");
  const access = await requireVendorAccess(parsed.data.slug, ["owner", "staff"]);
  const db = getDb();
  const [booking] = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, parsed.data.bookingId), eq(bookings.vendorId, access.vendorId)))
    .limit(1);
  if (!booking || booking.status !== "confirmed") return fail("This session is already closed");

  const outcome = parsed.data.outcome;
  if (outcome !== "cancelled" && new Date() < booking.startsAt) return fail("You can close a session once it has started");

  const [updated] = await db
    .update(bookings)
    .set(
      outcome === "cancelled"
        ? {
            status: "cancelled",
            cancelReason: parsed.data.reason || "Cancelled by the provider",
            ...(booking.paymentStatus === "paid" ? { paymentStatus: "refund_due" } : {}),
            updatedAt: new Date(),
          }
        : {
            status: outcome,
            // Pay-at-session money is collected in person when the session happens.
            ...(booking.paymentMode === "pay_at_session" && outcome === "done" ? { paymentStatus: "paid" } : {}),
            updatedAt: new Date(),
          }
    )
    .where(and(eq(bookings.id, booking.id), eq(bookings.status, "confirmed")))
    .returning({ id: bookings.id });
  if (!updated) return fail("This session just changed. Refresh and try again.");

  revalidateProvider(parsed.data.slug);
  revalidatePath(`/app/bookings/${booking.id}`);
  if (outcome === "cancelled") {
    const serviceName = booking.serviceId
      ? (await db.select({ name: services.name }).from(services).where(eq(services.id, booking.serviceId)).limit(1))[0]?.name
      : undefined;
    notifyAfter([booking.userId], {
      kind: "customer.booking.cancelled",
      serviceName: serviceName ?? "Your session",
      vendorName: access.vendor.name,
      startsAt: booking.startsAt,
      reason: parsed.data.reason,
    });
  }
  return { ok: true as const };
}

export async function saveAvailability(input: unknown) {
  const parsed = availabilitySchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid hours");
  const rules = parsed.data.rules;
  if (rules.some((r) => !isValidRule(r))) return fail("Each window must end after it starts");
  if (rulesOverlap(rules)) return fail("Two windows overlap on the same day");
  const access = await requireVendorAccess(parsed.data.slug, ["owner", "staff"]);
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.delete(availabilityRules).where(eq(availabilityRules.vendorId, access.vendorId));
    if (rules.length) await tx.insert(availabilityRules).values(rules.map((r) => ({ ...r, vendorId: access.vendorId })));
  });
  revalidateProvider(parsed.data.slug);
  return { ok: true as const };
}

export async function addTimeOff(input: unknown) {
  const parsed = timeOffSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid dates");
  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = new Date(parsed.data.endsAt);
  if (!(startsAt < endsAt)) return fail("Time off must end after it starts");
  const access = await requireVendorAccess(parsed.data.slug, ["owner", "staff"]);
  const db = getDb();
  await db.insert(availabilityBlocks).values({ vendorId: access.vendorId, startsAt, endsAt, reason: parsed.data.reason || null });
  revalidateProvider(parsed.data.slug);
  return { ok: true as const };
}

export async function removeTimeOff(input: unknown) {
  const parsed = removeTimeOffSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid input");
  const access = await requireVendorAccess(parsed.data.slug, ["owner", "staff"]);
  const db = getDb();
  await db.delete(availabilityBlocks).where(and(eq(availabilityBlocks.id, parsed.data.id), eq(availabilityBlocks.vendorId, access.vendorId)));
  revalidateProvider(parsed.data.slug);
  return { ok: true as const };
}

export async function saveBookingRules(input: unknown) {
  const parsed = bookingRulesSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid settings");
  const access = await requireVendorAccess(parsed.data.slug, ["owner"]);
  const db = getDb();
  await db
    .update(vendors)
    .set({ bookingNoticeMinutes: parsed.data.noticeMinutes, cancelCutoffHours: parsed.data.cancelCutoffHours, updatedAt: new Date() })
    .where(eq(vendors.id, access.vendorId));
  revalidateProvider(parsed.data.slug);
  return { ok: true as const };
}

/** Create or edit a service. Only booking categories (trainers, physio…) are allowed here. */
export async function saveService(input: unknown) {
  const parsed = saveServiceSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid service");
  const { slug, id, ...data } = parsed.data;
  const access = await requireVendorAccess(slug, ["owner"]);
  const type = toVendorType(access.vendor.vendorType, access.vendor.businessType);
  if (!canUseModule(type, "services")) return fail(canUseModule(type, "kids") ? "Add classes from the Classes & workshops page" : "Only booking providers have services");
  if (!allowedCategoryIds(type, access.vendor.categoryId).includes(data.categoryId)) return fail("You can only add services in your own category");
  const db = getDb();
  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, data.categoryId), eq(categories.fulfilment, "booking"), eq(categories.isActive, true)))
    .limit(1);
  if (!category) return fail("Pick a valid category");

  const values = {
    categoryId: data.categoryId,
    name: data.name,
    description: data.description || null,
    imageUrl: data.imageUrl || null,
    durationMinutes: data.durationMinutes,
    pricePaise: rupeesToPaise(data.priceRupees),
    modes: Array.from(new Set(data.modes)),
    isActive: data.isActive,
    updatedAt: new Date(),
  };
  if (id) {
    const [updated] = await db
      .update(services)
      .set(values)
      .where(and(eq(services.id, id), eq(services.vendorId, access.vendorId), isNull(services.archivedAt)))
      .returning({ id: services.id });
    if (!updated) return fail("Service not found");
  } else {
    const [created] = await db.insert(services).values({ ...values, vendorId: access.vendorId }).returning({ id: services.id });
    if (created && hasItemTable(type)) await provisionItemDetails(db, access.vendorId, type, created.id);
  }
  revalidateProvider(slug);
  return { ok: true as const };
}

/** Removes a service from the profile. Past bookings keep pointing at it, so it is archived. */
export async function archiveService(input: unknown) {
  const parsed = serviceIdSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid input");
  const access = await requireVendorAccess(parsed.data.slug, ["owner"]);
  const db = getDb();
  await db
    .update(services)
    .set({ archivedAt: new Date(), isActive: false, updatedAt: new Date() })
    .where(and(eq(services.id, parsed.data.id), eq(services.vendorId, access.vendorId)));
  revalidateProvider(parsed.data.slug);
  return { ok: true as const };
}
