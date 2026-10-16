"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { and, eq, gt, inArray, lt, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { availabilityBlocks, availabilityRules, bookings, shopOrderItems, shopOrders, vendors } from "@/db/schema";
import { requireUser, requireVendorAccess } from "@/lib/auth/session";
import { canCancelBooking, formatSlotTime, isValidRule, MODE_LABEL, openSlots, rulesOverlap } from "@/core/booking";
import { cartTotals, formatOrderNumber } from "@/core/shop";
import { dayLabelIST, todayIST } from "@/core/time";
import { addressLine, deliveryCheck, ensureCustomer, loadProfile } from "@/features/consumer/household";
import { moveOrder } from "@/features/shop-orders/lifecycle";
import { getBookableService } from "./queries";
import {
  availabilitySchema,
  bookingIdSchema,
  bookingSettingsSchema,
  bookSessionSchema,
  markBookingSchema,
  removeTimeOffSchema,
  timeOffSchema,
} from "./schemas";

const HOLD_MINUTES = 15;

function fail(error: string) {
  return { ok: false as const, error };
}

function istDate(d: Date): string {
  return todayIST(d);
}

/** Book one session. Online payments hold the slot for 15 minutes until Razorpay confirms. */
export async function bookSession(input: unknown) {
  const parsed = bookSessionSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid booking");

  const user = await requireUser();
  const profile = await loadProfile(user.id);
  if (!profile) return fail("Add your address and phone before booking");
  const data = parsed.data;
  const db = getDb();

  const [already] = await db.select({ id: shopOrders.id, userId: shopOrders.userId }).from(shopOrders).where(eq(shopOrders.clientKey, data.clientKey)).limit(1);
  if (already) return already.userId === user.id ? { ok: true as const, orderId: already.id } : fail("Please try again");

  const service = await getBookableService(data.productId);
  if (!service) return fail("This service is not available right now");
  const { product, vendor } = service;
  if (!vendor.acceptingOrders) return fail(`${vendor.name} is not taking bookings right now`);
  if (!vendor.serviceModes.includes(data.mode)) return fail("Pick a session type this provider offers");
  if (data.mode === "home") {
    const outOfArea = await deliveryCheck(vendor, profile);
    if (outOfArea) return fail(outOfArea.startsWith("Set") ? outOfArea : "This provider doesn't do home visits at your address. Try a studio or online session.");
  }

  const duration = product.durationMinutes ?? 60;
  const startsAt = new Date(data.startsAt);
  const endsAt = new Date(startsAt.getTime() + duration * 60_000);
  const date = istDate(startsAt);
  const now = new Date();
  const totals = cartTotals([{ unitPricePaise: product.pricePaise, qty: 1 }], 0);
  const sessionLine = `Session ${dayLabelIST(date)}, ${formatSlotTime(startsAt)} · ${MODE_LABEL[data.mode]}`;

  try {
    const orderId = await db.transaction(async (tx) => {
      // One booking at a time per provider, so two people can't take the same slot.
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${vendor.id}))`);

      // Release unpaid holds that ran out, and their unpaid orders.
      const expired = await tx
        .update(bookings)
        .set({ status: "cancelled", cancelReason: "Payment not completed in time", updatedAt: now })
        .where(and(eq(bookings.vendorId, vendor.id), eq(bookings.status, "held"), lt(bookings.heldUntil, now)))
        .returning({ orderId: bookings.shopOrderId });
      if (expired.length) {
        await tx
          .update(shopOrders)
          .set({ status: "cancelled", cancelReason: "Payment not completed in time", updatedAt: now })
          .where(and(inArray(shopOrders.id, expired.map((e) => e.orderId)), eq(shopOrders.status, "awaiting_payment")));
      }

      // Re-check the slot against the provider's rules, time off and live bookings.
      const [rules, busy] = await Promise.all([
        tx.select().from(availabilityRules).where(eq(availabilityRules.vendorId, vendor.id)),
        Promise.all([
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
        ]).then(([a, b]) => [...a, ...b]),
      ]);
      const free = openSlots({ date, rules, busy, durationMinutes: duration, noticeMinutes: vendor.bookingNoticeMinutes, now });
      if (!free.some((s) => s.getTime() === startsAt.getTime())) throw new Error("SLOT_TAKEN");

      const customerId = await ensureCustomer(tx, vendor.id, profile);
      const online = data.paymentMode === "online";
      const [order] = await tx
        .insert(shopOrders)
        .values({
          number: formatOrderNumber(todayIST(), crypto.randomBytes(3).toString("hex").slice(0, 5)),
          clientKey: data.clientKey,
          vendorId: vendor.id,
          customerId,
          userId: user.id,
          // Sessions come from the provider's own free hours, so they need no separate accept step.
          status: online ? "awaiting_payment" : "accepted",
          acceptedAt: online ? null : now,
          paymentMode: online ? "online" : "cod",
          subtotalPaise: totals.subtotalPaise,
          deliveryFeePaise: 0,
          totalPaise: totals.totalPaise,
          deliverOn: date,
          slot: "asap",
          address: data.mode === "home" ? addressLine(profile) : data.mode === "studio" ? `At ${vendor.name}, ${vendor.area}` : "Online session",
          notes: data.notes ? `${sessionLine}. ${data.notes}` : sessionLine,
        })
        .returning({ id: shopOrders.id });
      await tx.insert(shopOrderItems).values({
        orderId: order!.id,
        vendorId: vendor.id,
        productId: product.id,
        name: product.name,
        unitPricePaise: product.pricePaise,
        qty: 1,
        lineTotalPaise: product.pricePaise,
      });
      await tx.insert(bookings).values({
        vendorId: vendor.id,
        customerId,
        userId: user.id,
        productId: product.id,
        shopOrderId: order!.id,
        startsAt,
        endsAt,
        mode: data.mode,
        address: data.mode === "home" ? addressLine(profile) : null,
        status: online ? "held" : "confirmed",
        heldUntil: online ? new Date(now.getTime() + HOLD_MINUTES * 60_000) : null,
      });
      return order!.id;
    });

    revalidatePath(`/app/store/${vendor.slug}`);
    revalidatePath("/app/plans");
    revalidatePath(`/merchant-panel/${vendor.slug}/bookings`);
    return { ok: true as const, orderId };
  } catch (err) {
    if (err instanceof Error && err.message === "SLOT_TAKEN") return fail("That time was just taken. Pick another slot.");
    if (err instanceof Error && err.message === "PHONE_LINKED_ELSEWHERE") return fail("Your phone number is linked to another account at this provider.");
    return fail("Could not book. Please try again.");
  }
}

/** Household cancels before the provider's cutoff; a paid session becomes a refund for admin. */
export async function cancelMyBooking(input: unknown) {
  const parsed = bookingIdSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid booking");
  const user = await requireUser();
  const db = getDb();
  const [row] = await db
    .select({ booking: bookings, cutoff: vendors.cancelCutoffHours, slug: vendors.slug })
    .from(bookings)
    .innerJoin(vendors, eq(bookings.vendorId, vendors.id))
    .where(and(eq(bookings.id, parsed.data.bookingId), eq(bookings.userId, user.id)))
    .limit(1);
  if (!row) return fail("Booking not found");
  if (!["held", "confirmed"].includes(row.booking.status)) return fail("This session can't be cancelled");
  if (!canCancelBooking(row.booking.startsAt, new Date(), row.cutoff)) {
    return fail(`Sessions can be cancelled up to ${row.cutoff} hours before they start`);
  }
  // The cutoff was checked above; the order moves like an admin-resolved cancellation.
  const res = await moveOrder({
    orderId: row.booking.shopOrderId,
    vendorId: row.booking.vendorId,
    to: "cancelled",
    actor: "admin",
    actorId: user.id,
    reason: "Cancelled by customer",
  });
  if (!res.ok) return res;
  revalidatePath("/app/plans");
  revalidatePath(`/merchant-panel/${row.slug}/bookings`);
  return { ok: true as const };
}

/** Provider closes a session: done or no-show release the money, cancel refunds it. */
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

  const base = { orderId: booking.shopOrderId, vendorId: access.vendorId, actor: "vendor" as const, actorId: access.user.id };
  if (parsed.data.outcome === "cancelled") {
    const res = await moveOrder({ ...base, to: "cancelled", reason: parsed.data.reason || "Cancelled by provider" });
    if (!res.ok) return res;
  } else {
    if (new Date() < booking.startsAt) return fail("You can close a session once it has started");
    const [order] = await db.select({ status: shopOrders.status }).from(shopOrders).where(eq(shopOrders.id, booking.shopOrderId)).limit(1);
    if (order?.status === "placed") {
      const accepted = await moveOrder({ ...base, to: "accepted" });
      if (!accepted.ok) return accepted;
    }
    const res = await moveOrder({ ...base, to: "delivered" });
    if (!res.ok) return res;
    if (parsed.data.outcome === "no_show") {
      await db.update(bookings).set({ status: "no_show", updatedAt: new Date() }).where(eq(bookings.id, booking.id));
    }
  }
  revalidatePath(`/merchant-panel/${parsed.data.slug}/bookings`);
  revalidatePath(`/merchant-panel/${parsed.data.slug}/today`);
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
  revalidatePath(`/merchant-panel/${parsed.data.slug}/availability`);
  revalidatePath(`/app/store/${parsed.data.slug}`);
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
  revalidatePath(`/merchant-panel/${parsed.data.slug}/availability`);
  return { ok: true as const };
}

export async function removeTimeOff(input: unknown) {
  const parsed = removeTimeOffSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid input");
  const access = await requireVendorAccess(parsed.data.slug, ["owner", "staff"]);
  const db = getDb();
  await db.delete(availabilityBlocks).where(and(eq(availabilityBlocks.id, parsed.data.id), eq(availabilityBlocks.vendorId, access.vendorId)));
  revalidatePath(`/merchant-panel/${parsed.data.slug}/availability`);
  return { ok: true as const };
}

export async function saveBookingSettings(input: unknown) {
  const parsed = bookingSettingsSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid settings");
  const access = await requireVendorAccess(parsed.data.slug, ["owner"]);
  const db = getDb();
  await db
    .update(vendors)
    .set({
      serviceModes: parsed.data.modes,
      bookingNoticeMinutes: parsed.data.noticeMinutes,
      cancelCutoffHours: parsed.data.cancelCutoffHours,
      updatedAt: new Date(),
    })
    .where(eq(vendors.id, access.vendorId));
  revalidatePath(`/merchant-panel/${parsed.data.slug}/availability`);
  revalidatePath(`/app/store/${parsed.data.slug}`);
  return { ok: true as const };
}
