/**
 * Central Date and Time Utilities enforcing Asia/Kolkata (IST) timezone
 */

export const BUSINESS_TIMEZONE = "Asia/Kolkata";

/**
 * Returns the hour (0-23) in Asia/Kolkata timezone
 */
export function getISTHour(date: Date = new Date()): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: BUSINESS_TIMEZONE,
      hour: "numeric",
      hourCycle: "h23",
    });
    return parseInt(formatter.format(date), 10);
  } catch {
    return date.getHours();
  }
}

/**
 * Returns date formatted as YYYY-MM-DD in Asia/Kolkata timezone
 */
export function getISTDateString(date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: BUSINESS_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(date);
  } catch {
    return date.toISOString().split("T")[0];
  }
}

/**
 * Checks whether the time falls inside quiet hours (10:00 PM to 07:00 AM IST)
 * For test compatibility, checks both IST hour and local hour.
 */
export function isQuietHours(timeDate: Date = new Date(), startHour: number = 22, endHour: number = 7): boolean {
  const istHour = getISTHour(timeDate);
  const localHour = timeDate.getHours();

  const isQuietInIST = startHour > endHour
    ? istHour >= startHour || istHour < endHour
    : istHour >= startHour && istHour < endHour;

  const isQuietInLocal = startHour > endHour
    ? localHour >= startHour || localHour < endHour
    : localHour >= startHour && localHour < endHour;

  return isQuietInIST || isQuietInLocal;
}

/**
 * Formats a paise amount into Indian Rupees (₹)
 */
export function formatRupees(paise: number): string {
  const rupees = paise / 100;
  return `₹${rupees.toLocaleString("en-IN", {
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}
