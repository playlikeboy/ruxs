import { describe, expect, it } from "bun:test";
import {
  formatTicketNumber,
  suggestTicketPriority,
  TICKET_CATEGORIES,
  canTransitionTicket,
} from "./tickets";

describe("support ticket rules", () => {
  it("formats ticket numbers with date and uppercase suffix", () => {
    const num = formatTicketNumber("2026-10-17", "7b3fa");
    expect(num).toBe("TK-20261017-7B3FA");
  });

  it("identifies dispute and report categories accurately", () => {
    expect(TICKET_CATEGORIES.order_dispute.isDispute).toBe(true);
    expect(TICKET_CATEGORIES.billing_dispute.isDispute).toBe(true);
    expect(TICKET_CATEGORIES.report_store.isReport).toBe(true);
    expect(TICKET_CATEGORIES.report_review.isReport).toBe(true);
    expect(TICKET_CATEGORIES.general_query.isDispute).toBe(false);
    expect(TICKET_CATEGORIES.general_query.isReport).toBe(false);
  });

  it("suggests priority correctly based on category and emergency keywords", () => {
    expect(suggestTicketPriority("billing_dispute")).toBe("high");
    expect(suggestTicketPriority("report_store")).toBe("high");
    expect(suggestTicketPriority("order_dispute")).toBe("medium");
    expect(suggestTicketPriority("delivery_issue")).toBe("medium");
    expect(suggestTicketPriority("general_query")).toBe("low");
    expect(suggestTicketPriority("general_query", "This is an urgent safety concern")).toBe("urgent");
  });

  it("allows ticket status transitions", () => {
    expect(canTransitionTicket("open", "in_progress")).toBe(true);
    expect(canTransitionTicket("in_progress", "resolved")).toBe(true);
    expect(canTransitionTicket("resolved", "closed")).toBe(true);
    expect(canTransitionTicket("closed", "open")).toBe(true);
  });
});
