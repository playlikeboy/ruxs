"use client";

import { useMemo } from "react";

const dayFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "short" });
const numFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric" });
const monFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", month: "short" });
const hourFmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", hour12: false });
export const slotTimeFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" });

export type SlotDay = { date: string; slots: string[] };

/** Day strip plus morning/afternoon/evening times. Only real open slots are offered. */
export function SlotCalendar({
  calendar,
  date,
  slot,
  onDate,
  onSlot,
}: {
  calendar: SlotDay[];
  date: string;
  slot: string | null;
  onDate: (date: string) => void;
  onSlot: (slot: string) => void;
}) {
  const day = calendar.find((d) => d.date === date);
  const groups = useMemo(() => {
    const out: { label: string; slots: string[] }[] = [
      { label: "Morning", slots: [] },
      { label: "Afternoon", slots: [] },
      { label: "Evening", slots: [] },
    ];
    for (const s of day?.slots ?? []) {
      const hour = Number(hourFmt.format(new Date(s)));
      out[hour < 12 ? 0 : hour < 17 ? 1 : 2]!.slots.push(s);
    }
    return out.filter((g) => g.slots.length > 0);
  }, [day]);

  return (
    <>
      <section>
        <h2 className="text-[15px] font-semibold text-ink">Pick a day</h2>
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {calendar.map((d) => {
            const at = new Date(d.date + "T12:00:00+05:30");
            const active = d.date === date;
            const none = d.slots.length === 0;
            return (
              <button
                key={d.date}
                type="button"
                disabled={none}
                onClick={() => onDate(d.date)}
                aria-pressed={active}
                className={
                  "flex w-[62px] shrink-0 flex-col items-center rounded-2xl border py-2.5 transition " +
                  (active ? "border-ink bg-ink text-white" : none ? "border-dashed border-black/10 text-neutral-300" : "border-black/10 text-ink")
                }
              >
                <span className="text-[11px] font-semibold uppercase">{dayFmt.format(at)}</span>
                <span className="text-lg font-bold tabular-nums">{numFmt.format(at)}</span>
                <span className="text-[10px]">{none ? "Full" : monFmt.format(at)}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-[15px] font-semibold text-ink">Pick a time</h2>
        {groups.length === 0 ? (
          <p className="mt-2 rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-500">No free times this day. Try another day.</p>
        ) : (
          groups.map((g) => (
            <div key={g.label} className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{g.label}</p>
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {g.slots.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onSlot(s)}
                    aria-pressed={slot === s}
                    className={"h-11 rounded-xl border text-sm font-semibold tabular-nums transition " + (slot === s ? "border-accent bg-peach text-accent" : "border-black/10 text-ink")}
                  >
                    {slotTimeFmt.format(new Date(s)).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );
}
