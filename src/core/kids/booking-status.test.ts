import { describe, expect, it } from "bun:test";
import {
  KIDS_AWAITING_PROVIDER,
  canGuardianCancel,
  canProviderComplete,
  canProviderRespond,
  guardianStatusLabel,
  isKidsProviderVetted,
  isReviewEligible,
  providerStatusLabel,
  toCalendarStatus,
} from "./booking-status";

const now = new Date("2026-10-24T10:00:00Z");
const later = new Date("2026-10-25T10:00:00Z");
const earlier = new Date("2026-10-23T10:00:00Z");

describe("kids booking status rules", () => {
  it("new requests wait for the provider", () => {
    expect(KIDS_AWAITING_PROVIDER).toBe("held");
  });

  it("provider can accept or decline only a pending request before it starts", () => {
    expect(canProviderRespond("held", later, now)).toBe(true);
    expect(canProviderRespond("held", earlier, now)).toBe(false);
    expect(canProviderRespond("confirmed", later, now)).toBe(false);
    expect(canProviderRespond("cancelled", later, now)).toBe(false);
  });

  it("provider closes a confirmed session only after it starts", () => {
    expect(canProviderComplete("confirmed", earlier, now)).toBe(true);
    expect(canProviderComplete("confirmed", later, now)).toBe(false);
    expect(canProviderComplete("held", earlier, now)).toBe(false);
  });

  it("guardian can cancel pending or confirmed future sessions", () => {
    expect(canGuardianCancel("held", later, now)).toBe(true);
    expect(canGuardianCancel("confirmed", later, now)).toBe(true);
    expect(canGuardianCancel("confirmed", earlier, now)).toBe(false);
    expect(canGuardianCancel("completed", later, now)).toBe(false);
  });

  it("only completed sessions are review eligible", () => {
    expect(isReviewEligible("completed")).toBe(true);
    expect(isReviewEligible("confirmed")).toBe(false);
    expect(isReviewEligible("held")).toBe(false);
    expect(isReviewEligible("cancelled")).toBe(false);
  });

  it("maps kids statuses onto the merchant calendar vocabulary", () => {
    expect(toCalendarStatus("held", later, now)).toBe("requested");
    expect(toCalendarStatus("held", earlier, now)).toBe("expired");
    expect(toCalendarStatus("confirmed", later, now)).toBe("confirmed");
    expect(toCalendarStatus("completed", earlier, now)).toBe("done");
    expect(toCalendarStatus("cancelled", later, now)).toBe("cancelled");
  });

  it("labels say what happens next", () => {
    expect(guardianStatusLabel("held", later, now)).toBe("Awaiting provider");
    expect(guardianStatusLabel("held", earlier, now)).toBe("Not accepted");
    expect(guardianStatusLabel("confirmed", later, now)).toBe("Confirmed");
    expect(providerStatusLabel("held", later, now)).toBe("Needs your approval");
    expect(providerStatusLabel("completed", earlier, now)).toBe("Completed");
  });
});

describe("kids provider vetting", () => {
  it("fails closed unless approved and passed", () => {
    expect(isKidsProviderVetted({ verificationStatus: "approved", safetyReviewStatus: "passed" })).toBe(true);
    expect(isKidsProviderVetted({ verificationStatus: "approved", safetyReviewStatus: "pending" })).toBe(false);
    expect(isKidsProviderVetted({ verificationStatus: "pending", safetyReviewStatus: "passed" })).toBe(false);
    expect(isKidsProviderVetted({ verificationStatus: "suspended", safetyReviewStatus: "passed" })).toBe(false);
    expect(isKidsProviderVetted(null)).toBe(false);
    expect(isKidsProviderVetted(undefined)).toBe(false);
  });
});
