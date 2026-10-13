export const IST_TIMEZONE = "Asia/Kolkata";

/**
 * Returns today's date in Asia/Kolkata timezone (YYYY-MM-DD).
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
 * Combines an IST service date (YYYY-MM-DD) and a local time (HH:MM or HH:MM:SS)
 * into a UTC Date object representing that exact point in time.
 */
export function istDateTime(serviceDate: string, timeStr: string): Date {
  const parts = serviceDate.split("-").map(Number);
  const year = parts[0]!;
  const month = parts[1]!;
  const day = parts[2]!;

  const timeParts = timeStr.split(":").map(Number);
  const hour = timeParts[0] ?? 0;
  const minute = timeParts[1] ?? 0;
  const second = timeParts[2] ?? 0;

  // Asia/Kolkata is strictly UTC+05:30 with no daylight savings time
  const istOffsetMinutes = 5 * 60 + 30;
  const utcMillis =
    Date.UTC(year, month - 1, day, hour, minute, second) -
    istOffsetMinutes * 60 * 1000;

  return new Date(utcMillis);
}

/**
 * Returns lowercase weekday ("mon", "tue", "wed", "thu", "fri", "sat", "sun") in IST.
 */
export function weekdayIST(serviceDate: string): string {
  const d = istDateTime(serviceDate, "12:00:00");
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: IST_TIMEZONE,
    weekday: "short",
  });
  return formatter.format(d).toLowerCase();
}
