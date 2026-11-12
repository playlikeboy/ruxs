import { istDateTime } from "@/core/time";

/**
 * IST instant bounds of a billing period ("YYYY-MM"): `start` is the 1st at
 * 00:00 IST and `end` is the next month's 1st at 00:00 IST (exclusive).
 */
export function periodBounds(period: string): { start: Date; end: Date } {
  const [yearStr, monthStr] = period.split("-");
  const year = parseInt(yearStr!, 10);
  const month = parseInt(monthStr!, 10);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = (month === 12 ? 1 : month + 1).toString().padStart(2, "0");
  return {
    start: istDateTime(`${yearStr}-${monthStr}-01`, "00:00:00"),
    end: istDateTime(`${nextYear}-${nextMonth}-01`, "00:00:00"),
  };
}
