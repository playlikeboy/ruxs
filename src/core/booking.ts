/**
 * Booking rules for providers hired by the hour (gym trainers, physiotherapists).
 * Availability is weekly wall-clock time in IST; bookings and time off are instants.
 * Pure functions only.
 */
import { istDateTime, weekdayIST } from "./time";

export interface AvailabilityRule {
  weekday: string; // mon..sun
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
}

export interface Busy {
  startsAt: Date;
  endsAt: Date;
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidRule(rule: AvailabilityRule): boolean {
  return TIME.test(rule.startTime) && TIME.test(rule.endTime) && rule.startTime < rule.endTime;
}

export function overlaps(a: Busy, b: Busy): boolean {
  return a.startsAt < b.endsAt && b.startsAt < a.endsAt;
}

/** Rules may not overlap on the same weekday (keeps the slot grid unambiguous). */
export function rulesOverlap(rules: AvailabilityRule[]): boolean {
  const byDay = new Map<string, AvailabilityRule[]>();
  for (const r of rules) byDay.set(r.weekday, [...(byDay.get(r.weekday) ?? []), r]);
  for (const list of byDay.values()) {
    const sorted = [...list].sort((x, y) => x.startTime.localeCompare(y.startTime));
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i]!.startTime < sorted[i - 1]!.endTime) return true;
    }
  }
  return false;
}

/**
 * Free start times on one IST date for a session of `durationMinutes`.
 * Starts step every `stepMinutes` inside each rule window, must finish inside
 * the window, must be at least `noticeMinutes` after `now`, and must not
 * overlap a booking or a block.
 */
export function openSlots(input: {
  date: string; // YYYY-MM-DD, IST
  rules: AvailabilityRule[];
  busy: Busy[];
  durationMinutes: number;
  stepMinutes?: number;
  noticeMinutes: number;
  now: Date;
}): Date[] {
  const { date, rules, busy, durationMinutes, noticeMinutes, now } = input;
  const step = input.stepMinutes ?? 30;
  if (!Number.isInteger(durationMinutes) || durationMinutes < 15) return [];
  const weekday = weekdayIST(date);
  const earliest = now.getTime() + noticeMinutes * 60_000;
  const out: Date[] = [];

  for (const rule of rules.filter((r) => r.weekday === weekday && isValidRule(r))) {
    const windowStart = istDateTime(date, rule.startTime).getTime();
    const windowEnd = istDateTime(date, rule.endTime).getTime();
    for (let t = windowStart; t + durationMinutes * 60_000 <= windowEnd; t += step * 60_000) {
      if (t < earliest) continue;
      const slot = { startsAt: new Date(t), endsAt: new Date(t + durationMinutes * 60_000) };
      if (busy.some((b) => overlaps(slot, b))) continue;
      out.push(slot.startsAt);
    }
  }
  return out.sort((a, b) => a.getTime() - b.getTime());
}

/** Households can cancel until `cutoffHours` before the session starts. */
export function canCancelBooking(startsAt: Date, now: Date, cutoffHours: number): boolean {
  return startsAt.getTime() - now.getTime() >= cutoffHours * 3_600_000;
}

/** "7:00 am" in IST. */
export function formatSlotTime(d: Date): string {
  return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" }).format(d).toLowerCase();
}

export const MODE_LABEL: Record<string, string> = {
  home: "Home visit",
  studio: "At gym / clinic",
  online: "Online (video)",
};
