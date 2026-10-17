import { z } from "zod";

export const ticketCategoryEnum = z.enum([
  "order_dispute",
  "delivery_issue",
  "billing_dispute",
  "service_dispute",
  "report_store",
  "report_review",
  "general_query",
]);

export const raiseTicketSchema = z.object({
  category: ticketCategoryEnum,
  subject: z.string().trim().min(3, "Please provide a subject").max(120),
  description: z.string().trim().min(10, "Please provide at least 10 characters explaining the issue").max(2000),

  // Optional Context IDs
  vendorId: z.string().uuid().optional().nullable(),
  vendorName: z.string().optional().nullable(),
  orderId: z.string().uuid().optional().nullable(),
  bookingId: z.string().uuid().optional().nullable(),
  subscriptionId: z.string().uuid().optional().nullable(),
  reviewId: z.string().uuid().optional().nullable(),
});

export const updateTicketSchema = z.object({
  ticketId: z.string().uuid(),
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  adminNotes: z.string().trim().max(1000).optional(),
  resolution: z.string().trim().max(1000).optional(),
});
