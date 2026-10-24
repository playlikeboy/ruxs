"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CookingPot, Droplets, Milk, Music, ReceiptText } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { daySlots, type DaySlot } from "./home-content";

const ICONS: Record<DaySlot["icon"], typeof Milk> = {
  milk: Milk,
  water: Droplets,
  tiffin: CookingPot,
  kids: Music,
  bill: ReceiptText,
};

const DEFAULT_MINUTES = 12 * 60 + 30; // server render: lunchtime
const DAY_START = 6 * 60;
const DAY_END = 21 * 60;
const HOURS = Array.from({ length: (DAY_END - DAY_START) / 60 + 1 }, (_, i) => 6 + i);

function istMinutes(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return get("hour") * 60 + get("minute");
}

/** Desktop: true position on the 6:00 to 21:00 hour scale, from 0 to 1. */
function scale(minutes: number) {
  return Math.min(Math.max((minutes - DAY_START) / (DAY_END - DAY_START), 0), 1);
}

/** Mobile: position between evenly spaced rows, from 0 to 1. */
function rowProgress(minutes: number) {
  const n = daySlots.length;
  if (minutes <= daySlots[0]!.minutes) return 0;
  for (let i = 0; i < n; i++) {
    const start = daySlots[i]!.minutes;
    const end = daySlots[i + 1]?.minutes ?? DAY_END;
    if (minutes < end) return Math.min((i + (minutes - start) / (end - start)) / n, 0.96);
  }
  return 0.96;
}

function nextIndex(minutes: number) {
  const i = daySlots.findIndex((s) => s.minutes > minutes);
  return i === -1 ? 0 : i;
}

function clock(minutes: number) {
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
}

/**
 * One household day on a real hour scale. Each stop links into its category.
 * The "now" marker starts at lunchtime and glides to the visitor's IST time.
 */
export function DayRibbon() {
  const [minutes, setMinutes] = useState(DEFAULT_MINUTES);

  useEffect(() => {
    const tick = () => setMinutes(istMinutes(new Date()));
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const next = nextIndex(minutes);
  const nextSlot = daySlots[next]!;

  return (
    <div className="relative xl:mx-[18px]">
      <p className="mb-5 text-sm font-semibold tabular-nums text-ink xl:hidden">
        Now {clock(minutes)} <span className="font-normal text-[#4F5A4B]">· next: {nextSlot.name.toLowerCase()} at {nextSlot.time}</span>
      </p>

      {/* Hour scale (desktop): ticks every hour, labels every three hours */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 hidden h-[78px] xl:block">
        {HOURS.map((h) => {
          const x = `${scale(h * 60) * 100}%`;
          const major = (h - 6) % 3 === 0;
          return (
            <span key={h} style={{ left: x }} className="absolute top-0 h-full">
              {major && <span className="absolute -translate-x-1/2 text-xs font-semibold tabular-nums text-[#4F5A4B]">{h}:00</span>}
              <span className={cn("absolute top-[72px] w-px -translate-x-1/2 bg-ink", major ? "h-3 -mt-1.5" : "h-2 -mt-1")} />
            </span>
          );
        })}
      </div>

      <ol className="relative grid auto-rows-fr grid-cols-1 gap-y-6 pl-12 xl:block xl:h-[250px] xl:pl-0">
        <span aria-hidden="true" className="absolute bottom-6 left-[17px] top-2 w-0.5 bg-ink xl:inset-x-0 xl:bottom-auto xl:top-[71px] xl:h-0.5 xl:w-full" />
        <span
          aria-hidden="true"
          style={{ ["--pm" as string]: rowProgress(minutes), ["--pd" as string]: scale(minutes) }}
          className="day-now absolute left-[10px] top-[calc(18px+var(--pm)*(100%+24px))] h-4 w-4 -translate-y-1/2 rounded-full border-2 border-ink bg-accent shadow-[0_2px_8px_rgba(189,75,42,0.35)] xl:left-[calc(var(--pd)*100%)] xl:top-[72px] xl:-translate-x-1/2"
        >
          <span className="absolute bottom-[22px] left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-2.5 py-1 text-xs font-semibold tabular-nums text-bg xl:block">
            Now {clock(minutes)}
          </span>
        </span>

        {daySlots.map((slot, i) => {
          const Icon = ICONS[slot.icon];
          const isNext = i === next;
          const x = scale(slot.minutes) * 100;
          const w = scale(daySlots[i + 1]?.minutes ?? DAY_END) * 100 - x;
          return (
            <li
              key={slot.time}
              style={{ ["--x" as string]: `${x}%`, ["--w" as string]: `${w}%` }}
              className="relative xl:absolute xl:left-[calc(var(--x)-18px)] xl:top-[54px] xl:w-[calc(var(--w)-24px)] xl:pt-12"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "absolute -left-12 top-0 z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink xl:left-0",
                  isNext ? "bg-ink text-bg" : "bg-bg text-ink"
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
              </span>
              <Link
                href={slot.href}
                className={cn(
                  "group -mx-3 block rounded-[16px] px-3 py-2 transition-colors duration-200 hover:bg-bg/80 xl:py-3",
                  isNext && "bg-bg shadow-[0_6px_20px_-12px_rgba(32,36,31,0.35)]"
                )}
              >
                <span className="block text-[32px] font-bold leading-none tracking-[-0.03em] tabular-nums text-ink xl:text-[44px]">{slot.time}</span>
                <span className="mt-2 flex items-center gap-1.5 text-lg font-semibold text-ink">
                  {slot.name}
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-accent transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
                <span className="mt-1 block text-sm leading-snug text-[#4F5A4B]">{slot.detail}</span>
                {isNext && <span className="sr-only"> (coming up next)</span>}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
