"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { bookings, customers, shopOrders, subscriptions, supportTickets, vendorReviews, vendors } from "@/db/schema";
import { isUserAdmin, requireUser, requireVendorAccess } from "@/lib/auth/session";
import { loadProfile } from "@/features/consumer/household";
import { todayIST } from "@/core/time";
import { formatTicketNumber, suggestTicketPriority, TICKET_CATEGORIES, type TicketCategory } from "@/core/tickets";
import { renderEmailHtml, sendEmail } from "@/features/notifications/service";
import { raiseTicketSchema, updateTicketSchema } from "./schemas";

function fail(error: string) {
  return { ok: false as const, error };
}

export async function raiseTicket(input: unknown) {
  const parsed = raiseTicketSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid ticket details");
  }

  const user = await requireUser();
  const db = getDb();
  const profile = await loadProfile(user.id);

  const data = parsed.data;
  const userName = profile?.name ?? user.displayName ?? "RUXs Customer";
  const userPhone = profile?.phone ?? "Not provided";
  const userEmail = profile?.email ?? user.primaryEmail ?? null;

  // A linked store's name always comes from the database, never from the browser.
  let vendorName = data.vendorId ? null : (data.vendorName ?? null);
  if (data.vendorId) {
    const [v] = await db
      .select({ name: vendors.name })
      .from(vendors)
      .where(eq(vendors.id, data.vendorId))
      .limit(1);
    if (!v) return fail("We couldn't find that store. Refresh and try again.");
    vendorName = v.name;
  }

  // Linked records must be the household's own (a review only has to exist), and
  // must belong to the store the ticket is filed against. Ids come from the browser.
  const linked: { vendorId: string }[] = [];
  if (data.orderId) {
    const [o] = await db
      .select({ vendorId: shopOrders.vendorId })
      .from(shopOrders)
      .where(and(eq(shopOrders.id, data.orderId), eq(shopOrders.userId, user.id)))
      .limit(1);
    if (!o) return fail("We couldn't find that order. Refresh and try again.");
    linked.push(o);
  }
  if (data.bookingId) {
    const [b] = await db
      .select({ vendorId: bookings.vendorId })
      .from(bookings)
      .where(and(eq(bookings.id, data.bookingId), eq(bookings.userId, user.id)))
      .limit(1);
    if (!b) return fail("We couldn't find that booking. Refresh and try again.");
    linked.push(b);
  }
  if (data.subscriptionId) {
    const [sub] = await db
      .select({ vendorId: subscriptions.vendorId })
      .from(subscriptions)
      .innerJoin(customers, eq(subscriptions.customerId, customers.id))
      .where(and(eq(subscriptions.id, data.subscriptionId), eq(customers.userId, user.id)))
      .limit(1);
    if (!sub) return fail("We couldn't find that plan. Refresh and try again.");
    linked.push(sub);
  }
  if (data.reviewId) {
    const [r] = await db
      .select({ vendorId: vendorReviews.vendorId })
      .from(vendorReviews)
      .where(eq(vendorReviews.id, data.reviewId))
      .limit(1);
    if (!r) return fail("We couldn't find that review. Refresh and try again.");
    linked.push(r);
  }
  if (data.vendorId && linked.some((l) => l.vendorId !== data.vendorId)) {
    return fail("That doesn't belong to this store. Refresh and try again.");
  }

  const today = todayIST();
  const suffix = crypto.randomBytes(3).toString("hex").slice(0, 5);
  const ticketNumber = formatTicketNumber(today, suffix);
  const priority = suggestTicketPriority(data.category, data.description);

  try {
    const [ticket] = await db
      .insert(supportTickets)
      .values({
        number: ticketNumber,
        userId: user.id,
        userName,
        userPhone,
        userEmail,
        vendorId: data.vendorId || null,
        vendorName,
        category: data.category,
        subject: data.subject,
        description: data.description,
        orderId: data.orderId || null,
        bookingId: data.bookingId || null,
        subscriptionId: data.subscriptionId || null,
        reviewId: data.reviewId || null,
        status: "open",
        priority,
      })
      .returning({ id: supportTickets.id });

    revalidatePath("/app/tickets");
    revalidatePath("/app/account");
    revalidatePath("/admin/tickets");
    if (data.vendorId) {
      revalidatePath(`/merchant-panel`);
    }

    // Send confirmation email to household
    if (userEmail) {
      const categoryLabel = TICKET_CATEGORIES[data.category]?.label ?? data.category;
      const emailHtml = renderEmailHtml({
        heading: `Ticket Raised: #${ticketNumber}`,
        lead: `We have received your ${categoryLabel.toLowerCase()} and our support team is reviewing it.`,
        details: [
          { label: "Ticket Number", value: ticketNumber },
          { label: "Category", value: categoryLabel },
          { label: "Subject", value: data.subject },
          ...(vendorName ? [{ label: "Store", value: vendorName }] : []),
          { label: "Status", value: "Open (Under Review)" },
        ],
        actionText: "View Your Tickets",
        actionUrl: "https://ruxs.in/app/tickets",
      });

      sendEmail({
        to: userEmail,
        fromType: "alerts",
        subject: `[${ticketNumber}] Ticket received: ${data.subject.replace(/[\r\n]+/g, " ")}`,
        html: emailHtml,
        text: `Your ticket ${ticketNumber} has been received. Subject: ${data.subject}. We are looking into this and will update you shortly.`,
      }).catch((e) => console.error("Ticket email error:", e));
    }

    return { ok: true as const, ticketId: ticket!.id, ticketNumber };
  } catch (err) {
    console.error("Failed to raise ticket:", err);
    return fail("Could not submit your request. Please try again.");
  }
}

/**
 * Admin or store resolution update. Admins can change everything; a store's owner
 * or staff can only move the status and write the household-visible resolution
 * on tickets linked to their own store.
 */
export async function updateTicketStatus(input: unknown) {
  const parsed = updateTicketSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid parameters");

  const user = await requireUser();
  const db = getDb();
  const { ticketId, status, priority, adminNotes, resolution } = parsed.data;

  const [existing] = await db
    .select({ vendorId: supportTickets.vendorId, vendorSlug: vendors.slug, resolvedAt: supportTickets.resolvedAt, category: supportTickets.category })
    .from(supportTickets)
    .leftJoin(vendors, eq(supportTickets.vendorId, vendors.id))
    .where(eq(supportTickets.id, ticketId))
    .limit(1);
  if (!existing) return fail("Ticket not found");

  const isAdmin = await isUserAdmin(user);
  let merchantSlug: string | null = null;
  if (!isAdmin) {
    // Reports about a store or a review are for RUXs to judge, never the reported store.
    if (!existing.vendorSlug || TICKET_CATEGORIES[existing.category as TicketCategory]?.isReport) {
      return fail("Unauthorized to update this ticket");
    }
    // Throws (not found) unless this user is the store's owner or staff.
    await requireVendorAccess(existing.vendorSlug, ["owner", "staff"]);
    merchantSlug = existing.vendorSlug;
  }

  const closing = status === "resolved" || status === "closed";
  const updateFields: Partial<typeof supportTickets.$inferInsert> = {
    status,
    updatedAt: new Date(),
    // Stamp when the ticket was first closed; reopening clears it.
    resolvedAt: closing ? (existing.resolvedAt ?? new Date()) : null,
  };
  if (resolution !== undefined) updateFields.resolution = resolution;
  if (isAdmin) {
    if (priority) updateFields.priority = priority;
    if (adminNotes !== undefined) updateFields.adminNotes = adminNotes;
  }

  try {
    await db.update(supportTickets).set(updateFields).where(eq(supportTickets.id, ticketId));
  } catch (err) {
    console.error("Failed to update ticket:", err);
    return fail("Could not save the ticket. Please try again.");
  }

  revalidatePath("/app/tickets");
  revalidatePath("/admin/tickets");
  if (merchantSlug) revalidatePath(`/merchant-panel/${merchantSlug}/disputes`);

  return { ok: true as const };
}
