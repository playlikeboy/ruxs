import { addDaysIST, istDateTime, todayIST } from "./time";

/** Evening reminders go out once, in the cron runs between 18:00 and 18:10 IST. */
export function isEveningReminderWindow(now: Date) {
  const start = istDateTime(todayIST(now), "18:00");
  return now >= start && now.getTime() < start.getTime() + 10 * 60_000;
}

/** Tomorrow as an IST calendar day: [from, until). */
export function tomorrowRangeIST(now: Date) {
  const date = addDaysIST(todayIST(now), 1);
  return { date, from: istDateTime(date, "00:00"), until: istDateTime(addDaysIST(date, 1), "00:00") };
}
