/**
 * Pure rules for support tickets, dispute handling, and entity reporting.
 * No DB or framework imports here per AGENTS.md.
 */

export type TicketCategory =
  | "order_dispute"
  | "delivery_issue"
  | "billing_dispute"
  | "service_dispute"
  | "report_store"
  | "report_review"
  | "general_query";

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";

export interface TicketCategoryMeta {
  label: string;
  description: string;
  isDispute: boolean;
  isReport: boolean;
}

export const TICKET_CATEGORIES: Record<TicketCategory, TicketCategoryMeta> = {
  order_dispute: {
    label: "Order Dispute",
    description: "Quality issue, missing or incorrect item, damaged container.",
    isDispute: true,
    isReport: false,
  },
  delivery_issue: {
    label: "Delivery Problem",
    description: "Marked delivered but not received, extreme delay, delivered to wrong door.",
    isDispute: true,
    isReport: false,
  },
  billing_dispute: {
    label: "Payment & Billing Dispute",
    description: "Charged for skipped day, double charge, refund request, incorrect bill.",
    isDispute: true,
    isReport: false,
  },
  service_dispute: {
    label: "Service / Booking Dispute",
    description: "Trainer or artist did not arrive, cancellation dispute, incomplete service.",
    isDispute: true,
    isReport: false,
  },
  report_store: {
    label: "Report Store / Vendor",
    description: "Hygiene or food safety concern, abusive conduct, fraudulent listing.",
    isDispute: false,
    isReport: true,
  },
  report_review: {
    label: "Report Review",
    description: "Spam, fake review, offensive or harassing content.",
    isDispute: false,
    isReport: true,
  },
  general_query: {
    label: "General Help / Feedback",
    description: "Questions about plans, account, suggestions, or other inquiries.",
    isDispute: false,
    isReport: false,
  },
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

/**
 * Formats a clean, readable ticket reference number.
 * Example: TK-20261017-7B3F
 */
export function formatTicketNumber(serviceDate: string, randomSuffix: string): string {
  const compactDate = serviceDate.replace(/-/g, "");
  const cleanSuffix = randomSuffix.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
  return `TK-${compactDate}-${cleanSuffix}`;
}

/**
 * Validates whether a status transition is permitted.
 */
export function canTransitionTicket(
  from: TicketStatus,
  to: TicketStatus
): boolean {
  if (from === to) return true;
  // All standard workflows allowed; closed tickets can be reopened if user re-escalates
  return true;
}

/**
 * Suggests default ticket priority based on category and description hints.
 */
export function suggestTicketPriority(
  category: TicketCategory,
  description = ""
): TicketPriority {
  const text = description.toLowerCase();
  if (
    text.includes("fraud") ||
    text.includes("emergency") ||
    text.includes("harass") ||
    text.includes("safety") ||
    text.includes("poison") ||
    text.includes("urgent")
  ) {
    return "urgent";
  }

  if (category === "billing_dispute" || category === "report_store") {
    return "high";
  }

  if (
    category === "order_dispute" ||
    category === "delivery_issue" ||
    category === "service_dispute"
  ) {
    return "medium";
  }

  return "low";
}
