/**
 * Pure helpers for the merchant calendar (day / week grid). Times are IST,
 * which has no daylight saving, so minute maths is exact.
 */
import { addDaysIST, todayIST, weekdayIST } from "./time";

const IST_OFFSET_MS = 330 * 60_000;
const DAY_MS = 86_400_000;

/** Minutes since IST midnight for a moment in time (0..1439). */
export function istMinutes(d: Date): number {
  return Math.floor((((d.getTime() + IST_OFFSET_MS) % DAY_MS) + DAY_MS) % DAY_MS / 60_000);
}

/** "06:30" → 390. */
export function hhmmToMinutes(t: string): number {
  const [h = 0, m = 0] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Monday of the IST week that contains `date` (YYYY-MM-DD). */
export function weekStartIST(date: string): string {
  const order = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  return addDaysIST(date, -order.indexOf(weekdayIST(date)));
}

/** The seven dates of the week starting on `monday`. */
export function weekDates(monday: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDaysIST(monday, i));
}

/** A valid YYYY-MM-DD from a query param, else today. */
export function parseDateParam(value: string | undefined, now = new Date()): string {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + "T00:00:00Z"))) return value;
  return todayIST(now);
}

/**
 * Visible hour range for the grid: the vendor's earliest opening to latest
 * closing, widened to include every event, defaulting to 07:00–21:00.
 */
export function gridHours(ruleRanges: { startTime: string; endTime: string }[], events: { start: number; end: number }[]): { from: number; to: number } {
  const starts = [...ruleRanges.map((r) => hhmmToMinutes(r.startTime)), ...events.map((e) => e.start)];
  const ends = [...ruleRanges.map((r) => hhmmToMinutes(r.endTime)), ...events.map((e) => e.end)];
  const from = starts.length ? Math.floor(Math.min(...starts) / 60) : 7;
  const to = ends.length ? Math.ceil(Math.max(...ends) / 60) : 21;
  return { from: Math.max(0, Math.min(from, 7)), to: Math.min(24, Math.max(to, from + 4, 21)) };
}

export interface Placed<T> {
  item: T;
  lane: number;
  lanes: number;
}

/**
 * Side-by-side lanes for overlapping events in one day, like Google / cal.com.
 * Each cluster of overlapping events shares a lane count.
 */
export function layoutLanes<T extends { start: number; end: number }>(events: T[]): Placed<T>[] {
  const sorted = [...events].sort((a, b) => a.start - b.start || b.end - a.end);
  const out: Placed<T>[] = [];
  let cluster: Placed<T>[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -1;

  const flush = () => {
    for (const p of cluster) p.lanes = laneEnds.length;
    out.push(...cluster);
    cluster = [];
    laneEnds = [];
  };

  for (const e of sorted) {
    if (cluster.length && e.start >= clusterEnd) flush();
    let lane = laneEnds.findIndex((end) => end <= e.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(e.end);
    } else {
      laneEnds[lane] = e.end;
    }
    cluster.push({ item: e, lane, lanes: 1 });
    clusterEnd = Math.max(clusterEnd, e.end);
  }
  flush();
  return out;
}
