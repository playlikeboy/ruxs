/**
 * Kids session booking lifecycle.
 *
 *   held (awaiting provider) ──accept──▶ confirmed ──after start──▶ completed
 *        │                                  │
 *        └──decline / guardian cancel──▶ cancelled ◀──cancel before start
 *
 * `held` reuses the existing DB status (it already reserves the slot and is
 * allowed by the check constraint), so no migration is needed. A request the
 * provider never answered before the start time is shown as expired.
 */

export type KidsBookingStatus = "held" | "confirmed" | "completed" | "cancelled";

/** Status every new guardian request starts in. */
export const KIDS_AWAITING_PROVIDER = "held" satisfies KidsBookingStatus;

export function canProviderRespond(status: string, startsAt: Date, now: Date = new Date()) {
  return status === KIDS_AWAITING_PROVIDER && startsAt > now;
}

export function canProviderComplete(status: string, startsAt: Date, now: Date = new Date()) {
  return status === "confirmed" && startsAt <= now;
}

export function canGuardianCancel(status: string, startsAt: Date, now: Date = new Date()) {
  return (status === KIDS_AWAITING_PROVIDER || status === "confirmed") && startsAt > now;
}

export function isReviewEligible(status: string) {
  return status === "completed";
}

/** Merchant calendar vocabulary shared with generic bookings. */
export function toCalendarStatus(status: string, startsAt: Date, now: Date = new Date()) {
  if (status === KIDS_AWAITING_PROVIDER) return startsAt > now ? "requested" : "expired";
  if (status === "completed") return "done";
  return status;
}

export function guardianStatusLabel(status: string, startsAt: Date, now: Date = new Date()) {
  if (status === KIDS_AWAITING_PROVIDER) return startsAt > now ? "Awaiting provider" : "Not accepted";
  return LABELS[status] ?? status;
}

export function providerStatusLabel(status: string, startsAt: Date, now: Date = new Date()) {
  if (status === KIDS_AWAITING_PROVIDER) return startsAt > now ? "Needs your approval" : "Expired request";
  return LABELS[status] ?? status;
}

const LABELS: Record<string, string> = {
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Child safety gate: only approved providers with a passed safety review are listed or bookable. */
export function isKidsProviderVetted(profile: { verificationStatus: string; safetyReviewStatus: string } | null | undefined) {
  return profile?.verificationStatus === "approved" && profile.safetyReviewStatus === "passed";
}
