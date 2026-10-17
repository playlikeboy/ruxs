"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { supportTickets, vendors } from "@/db/schema";
import { requireAdmin, requireUser, requireVendorAccess } from "@/lib/auth/session";
import { loadProfile } from "@/features/consumer/household";
import { todayIST } from "@/core/time";
import { formatTicketNumber, suggestTicketPriority, TICKET_CATEGORIES } from "@/core/tickets";
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

  // Resolve vendor name if vendorId is provided
  let vendorName = data.vendorName ?? null;
  if (data.vendorId && !vendorName) {
    const [v] = await db
      .select({ name: vendors.name })
      .from(vendors)
      .where(eq(vendors.id, data.vendorId))
      .limit(1);
    vendorName = v?.name ?? null;
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
        subject: `[${ticketNumber}] Ticket Received: ${data.subject}`,
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

/** Admin or vendor resolution update */
export async function updateTicketStatus(input: unknown) {
  const parsed = updateTicketSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid parameters");

  const db = getDb();
  const { ticketId, status, priority, adminNotes, resolution } = parsed.data;

  // Check if admin or vendor
  let isAuthorized = false;
  try {
    await requireAdmin();
    isAuthorized = true;
  } catch {
    // If not admin, check if vendor has access to the ticket
    const [existing] = await db
      .select({ vendorId: supportTickets.vendorId })
      .from(supportTickets)
      .where(eq(supportTickets.id, ticketId))
      .limit(1);

    if (existing?.vendorId) {
      const [v] = await db.select({ slug: vendors.slug }).from(vendors).where(eq(vendors.id, existing.vendorId)).limit(1);
      if (v?.slug) {
        await requireVendorAccess(v.slug);
        isAuthorized = true;
      }
    }
  }

  if (!isAuthorized) return fail("Unauthorized to update this ticket");

  const updateFields: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
  };

  if (priority) updateFields.priority = priority;
  if (adminNotes !== undefined) updateFields.adminNotes = adminNotes;
  if (resolution !== undefined) {
    updateFields.resolution = resolution;
    if (status === "resolved" || status === "closed") {
      updateFields.resolvedAt = new Date();
    }
  }

  await db.update(supportTickets).set(updateFields).where(eq(supportTickets.id, ticketId));

  revalidatePath("/app/tickets");
  revalidatePath("/admin/tickets");

  return { ok: true as const };
}
