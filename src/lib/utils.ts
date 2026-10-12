import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const IST_TIMEZONE = "Asia/Kolkata";

/**
 * Returns today's date string in Asia/Kolkata (YYYY-MM-DD)
 */
export function todayIST(now = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(now);
}

/**
 * Combines an IST service date (YYYY-MM-DD) and a time string (HH:MM or HH:MM:SS)
 * into a valid UTC Date object representing that exact moment in Asia/Kolkata.
 */
export function istDateTime(serviceDate: string, timeStr: string): Date {
  const [year, month, day] = serviceDate.split("-").map(Number);
  const timeParts = timeStr.split(":").map(Number);
  const hour = timeParts[0] ?? 0;
  const minute = timeParts[1] ?? 0;
  const second = timeParts[2] ?? 0;

  // Asia/Kolkata is UTC+05:30 with no daylight savings time
  const istOffsetMinutes = 5 * 60 + 30;
  const utcMillis =
    Date.UTC(year!, month! - 1, day!, hour, minute, second) -
    istOffsetMinutes * 60 * 1000;

  return new Date(utcMillis);
}

/**
 * Returns the lowercase short weekday ("mon", "tue", "wed", "thu", "fri", "sat", "sun") in IST for a date.
 */
export function weekdayIST(serviceDate: string): string {
  const d = istDateTime(serviceDate, "12:00:00");
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: IST_TIMEZONE,
    weekday: "short",
  });
  return formatter.format(d).toLowerCase();
}
