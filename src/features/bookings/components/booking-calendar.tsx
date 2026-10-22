"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, MapPin, Phone, Video, X, Home, Building2, CalendarClock, StickyNote } from "lucide-react";
import { formatINR } from "@/core/money";
import { istMinutes, layoutLanes } from "@/core/calendar";
import { formatSlotTime, MODE_LABEL } from "@/core/booking";
import { cn } from "@/components/ui/cn";
import { SessionActions } from "./booking-buttons";

export interface CalEvent {
  id: string;
  number: string;
  start: string; // ISO
  end: string;
  status: string;
  mode: string;
  address: string | null;
  pricePaise: number;
  paymentMode: string;
  paymentStatus: string;
  notes: string | null;
  customerName: string;
  customerPhone: string;
  serviceName: string | null;
}

export type CalView = "day" | "week" | "list";
export type ListTab = "upcoming" | "past" | "cancelled";

const HOUR_PX = 60;

const STATUS: Record<string, { label: string; block: string; dot: string }> = {
  confirmed: { label: "Confirmed", block: "border-accent bg-peach text-ink", dot: "bg-accent" },
  held: { label: "Awaiting payment", block: "border-warn border-dashed bg-butter text-ink", dot: "bg-warn" },
  done: { label: "Done", block: "border-good bg-mint text-ink", dot: "bg-good" },
  no_show: { label: "No-show", block: "border-bad bg-blush text-ink", dot: "bg-bad" },
  cancelled: { label: "Cancelled", block: "border-line bg-bg text-muted line-through", dot: "bg-muted" },
};

const MODE_ICON: Record<string, typeof Home> = { home: Home, studio: Building2, online: Video };

function href(slug: string, q: Record<string, string>) {
  return `/merchant-panel/${slug}/bookings?` + new URLSearchParams(q).toString();
}

function dayHeading(date: string) {
  const d = new Date(date + "T12:00:00+05:30");
  return {
    weekday: d.toLocaleDateString("en-IN", { weekday: "short", timeZone: "Asia/Kolkata" }),
    day: d.toLocaleDateString("en-IN", { day: "numeric", timeZone: "Asia/Kolkata" }),
    long: d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" }),
  };
}

/**
 * The merchant booking calendar: a cal.com-style week / day time grid with
 * open hours shaded, plus an upcoming / past / cancelled list. Navigation is
 * plain links (the server renders each range); only the detail sheet is client state.
 */
export function BookingCalendar(p: {
  slug: string;
  view: CalView;
  date: string;
  today: string;
  days: string[];
  prev: string;
  next: string;
  rangeLabel: string;
  events: CalEvent[];
  openHours: Record<string, { start: number; end: number }[]>; // by date
  timeOff: { date: string; start: number; end: number; reason: string | null }[];
  hours: { from: number; to: number };
  tab: ListTab;
}) {
  const [selected, setSelected] = useState<CalEvent | null>(null);
  const [nowMin, setNowMin] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNowMin(istMinutes(new Date()));
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {p.view !== "list" && (
            <>
              <Link href={href(p.slug, { view: p.view, date: p.today })} className="flex h-9 items-center rounded-control border border-line bg-surface px-3 text-sm font-semibold text-ink hover:bg-bg">
                Today
              </Link>
              <div className="flex items-center rounded-control border border-line bg-surface">
                <Link href={href(p.slug, { view: p.view, date: p.prev })} aria-label="Previous" className="flex h-9 w-9 items-center justify-center text-muted hover:text-ink">
                  <ChevronLeft className="h-4 w-4" />
                </Link>
                <Link href={href(p.slug, { view: p.view, date: p.next })} aria-label="Next" className="flex h-9 w-9 items-center justify-center border-l border-line text-muted hover:text-ink">
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </>
          )}
          <h2 className="text-[15px] font-semibold text-ink">{p.view === "list" ? "All bookings" : p.rangeLabel}</h2>
        </div>
        <div role="tablist" aria-label="Calendar view" className="flex rounded-control bg-bg p-0.5 ring-1 ring-line">
          {(["day", "week", "list"] as const).map((v) => (
            <Link
              key={v}
              role="tab"
              aria-selected={p.view === v}
              href={href(p.slug, v === "list" ? { view: v, tab: p.tab } : { view: v, date: p.date })}
              className={cn("flex h-8 items-center rounded-[8px] px-3 text-[13px] font-semibold capitalize", p.view === v ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink")}
            >
              {v}
            </Link>
          ))}
        </div>
      </div>

      {p.view === "list" ? (
        <ListView {...p} onSelect={setSelected} />
      ) : (
        <GridView {...p} nowMin={nowMin} onSelect={setSelected} />
      )}

      <Legend />

      {selected && <DetailSheet slug={p.slug} event={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function GridView(p: Parameters<typeof BookingCalendar>[0] & { nowMin: number | null; onSelect: (e: CalEvent) => void }) {
  const hours = Array.from({ length: p.hours.to - p.hours.from }, (_, i) => p.hours.from + i);
  const height = hours.length * HOUR_PX;
  const top = (min: number) => ((min - p.hours.from * 60) / 60) * HOUR_PX;
  const byDay = new Map<string, CalEvent[]>();
  for (const e of p.events) {
    const d = new Date(e.start).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    byDay.set(d, [...(byDay.get(d) ?? []), e]);
  }
  const cols = p.days.length;

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="overflow-x-auto">
        <div style={{ minWidth: cols > 1 ? 760 : undefined }}>
          {/* Day headers */}
          <div className="sticky top-0 z-10 grid border-b border-line bg-surface" style={{ gridTemplateColumns: `56px repeat(${cols}, minmax(0, 1fr))` }}>
            <div />
            {p.days.map((d) => {
              const h = dayHeading(d);
              const isToday = d === p.today;
              const count = (byDay.get(d) ?? []).filter((e) => e.status !== "cancelled").length;
              return (
                <Link key={d} href={href(p.slug, { view: "day", date: d })} className="flex flex-col items-center gap-0.5 border-l border-line py-2 hover:bg-bg">
                  <span className={cn("text-[11px] font-semibold uppercase tracking-wide", isToday ? "text-accent" : "text-muted")}>{h.weekday}</span>
                  <span className={cn("flex h-8 w-8 items-center justify-center rounded-full text-[15px] font-semibold tabular-nums", isToday ? "bg-accent text-white" : "text-ink")}>{h.day}</span>
                  <span className="h-3 text-[10px] text-muted">{count ? `${count} booked` : ""}</span>
                </Link>
              );
            })}
          </div>

          {/* Time grid */}
          <div className="relative grid" style={{ gridTemplateColumns: `56px repeat(${cols}, minmax(0, 1fr))`, height }}>
            <div className="relative">
              {hours.map((h) => (
                <span key={h} className="absolute right-2 -translate-y-1/2 text-[10px] tabular-nums text-muted" style={{ top: top(h * 60) }}>
                  {h === p.hours.from ? "" : `${((h + 11) % 12) + 1} ${h < 12 ? "am" : "pm"}`}
                </span>
              ))}
            </div>
            {p.days.map((d) => {
              const placed = layoutLanes(
                (byDay.get(d) ?? []).map((e) => ({ e, start: istMinutes(new Date(e.start)), end: Math.max(istMinutes(new Date(e.start)) + 15, istMinutes(new Date(e.end)) || 1440) }))
              );
              return (
                <div key={d} className="relative border-l border-line bg-[repeating-linear-gradient(135deg,transparent,transparent_6px,rgba(0,0,0,0.025)_6px,rgba(0,0,0,0.025)_7px)]">
                  {/* open hours are white */}
                  {(p.openHours[d] ?? []).map((w, i) => (
                    <div key={i} className="absolute inset-x-0 bg-surface" style={{ top: top(w.start), height: ((w.end - w.start) / 60) * HOUR_PX }} />
                  ))}
                  {/* hour lines */}
                  {hours.map((h) => (
                    <div key={h} className="pointer-events-none absolute inset-x-0 border-t border-line/70" style={{ top: top(h * 60) }} />
                  ))}
                  {/* time off */}
                  {p.timeOff.filter((b) => b.date === d).map((b, i) => (
                    <div key={i} className="absolute inset-x-1 rounded-md bg-bad/5 px-1.5 py-1 text-[10px] font-medium text-bad ring-1 ring-inset ring-bad/15" style={{ top: top(b.start), height: Math.max(18, ((b.end - b.start) / 60) * HOUR_PX) }}>
                      {b.reason || "Time off"}
                    </div>
                  ))}
                  {/* events */}
                  {placed.map(({ item, lane, lanes }) => {
                    const e = item.e;
                    const tone = STATUS[e.status] ?? STATUS.confirmed!;
                    const h = Math.max(22, ((item.end - item.start) / 60) * HOUR_PX - 2);
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => p.onSelect(e)}
                        className={cn("absolute overflow-hidden rounded-md border-l-[3px] px-1.5 py-1 text-left shadow-sm transition hover:z-20 hover:shadow-md focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40", tone.block)}
                        style={{ top: top(item.start) + 1, height: h, left: `calc(${(lane / lanes) * 100}% + 2px)`, width: `calc(${100 / lanes}% - 4px)` }}
                      >
                        <span className="block truncate text-[11px] font-semibold leading-tight">{e.serviceName ?? "Session"}</span>
                        {h > 34 && <span className="block truncate text-[10px] leading-tight opacity-80">{formatSlotTime(new Date(e.start))} · {e.customerName}</span>}
                      </button>
                    );
                  })}
                  {/* now line */}
                  {d === p.today && p.nowMin != null && p.nowMin >= p.hours.from * 60 && p.nowMin <= p.hours.to * 60 && (
                    <div className="pointer-events-none absolute inset-x-0 z-10 flex items-center" style={{ top: top(p.nowMin) }}>
                      <span className="-ml-1 h-2.5 w-2.5 rounded-full bg-bad" />
                      <span className="h-[2px] flex-1 bg-bad" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ListView(p: Parameters<typeof BookingCalendar>[0] & { onSelect: (e: CalEvent) => void }) {
  const groups = new Map<string, CalEvent[]>();
  for (const e of p.events) {
    const d = new Date(e.start).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    groups.set(d, [...(groups.get(d) ?? []), e]);
  }
  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-line">
        {(["upcoming", "past", "cancelled"] as const).map((t) => (
          <Link
            key={t}
            href={href(p.slug, { view: "list", tab: t })}
            className={cn("-mb-px border-b-2 px-3 pb-2 text-sm font-semibold capitalize", p.tab === t ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink")}
          >
            {t}
          </Link>
        ))}
      </div>
      {p.events.length === 0 ? (
        <div className="rounded-card border border-dashed border-line bg-surface p-8 text-center">
          <CalendarClock className="mx-auto h-8 w-8 text-muted" aria-hidden="true" />
          <p className="mt-2 font-semibold text-ink">No {p.tab} bookings</p>
          <p className="mt-1 text-sm text-muted">{p.tab === "upcoming" ? "Open more hours to get booked more often." : "Nothing here yet."}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          {Array.from(groups.entries()).map(([date, list]) => (
            <div key={date}>
              <p className="border-b border-line bg-bg px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted">{dayHeading(date).long}</p>
              <ul className="divide-y divide-line">
                {list.map((e) => {
                  const tone = STATUS[e.status] ?? STATUS.confirmed!;
                  const ModeIcon = MODE_ICON[e.mode] ?? Clock;
                  return (
                    <li key={e.id}>
                      <button type="button" onClick={() => p.onSelect(e)} className="flex w-full items-start gap-4 px-4 py-3 text-left hover:bg-bg/60">
                        <div className="w-24 shrink-0">
                          <p className="text-sm font-semibold tabular-nums text-ink">{formatSlotTime(new Date(e.start))}</p>
                          <p className="text-xs tabular-nums text-muted">{formatSlotTime(new Date(e.end))}</p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cn("truncate font-semibold", e.status === "cancelled" ? "text-muted line-through" : "text-ink")}>
                            {e.serviceName ?? "Session"} <span className="font-normal text-muted">with</span> {e.customerName}
                          </p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                            <span className="inline-flex items-center gap-1"><ModeIcon className="h-3.5 w-3.5" aria-hidden="true" />{MODE_LABEL[e.mode] ?? e.mode}</span>
                            <span className="tabular-nums">{formatINR(e.pricePaise)} · {e.paymentMode === "online" ? "online" : "pay at session"}</span>
                          </p>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-[11px] font-semibold text-muted">
                          <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
                          {tone.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
      {(["confirmed", "held", "done", "no_show", "cancelled"] as const).map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5">
          <span className={cn("h-2 w-2 rounded-full", STATUS[s]!.dot)} /> {STATUS[s]!.label}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-4 rounded-sm bg-[repeating-linear-gradient(135deg,transparent,transparent_2px,rgba(0,0,0,0.12)_2px,rgba(0,0,0,0.12)_3px)] ring-1 ring-line" /> Closed
      </span>
    </div>
  );
}

function DetailSheet({ slug, event: e, onClose }: { slug: string; event: CalEvent; onClose: () => void }) {
  const tone = STATUS[e.status] ?? STATUS.confirmed!;
  const start = new Date(e.start);
  const ModeIcon = MODE_ICON[e.mode] ?? Clock;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-stretch sm:justify-end" role="dialog" aria-modal="true" aria-labelledby="booking-sheet-title">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative max-h-[85dvh] w-full overflow-y-auto rounded-t-3xl bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:max-h-none sm:w-[400px] sm:rounded-none sm:pb-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-[11px] font-semibold text-muted">
              <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} /> {tone.label}
            </span>
            <h3 id="booking-sheet-title" className="mt-2 text-lg font-semibold text-ink">{e.serviceName ?? "Session"}</h3>
            <p className="text-sm text-muted">
              {start.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" })}
            </p>
            <p className="text-sm font-semibold tabular-nums text-ink">
              {formatSlotTime(start)} – {formatSlotTime(new Date(e.end))}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full bg-bg text-muted hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex gap-3">
            <dt className="w-20 shrink-0 text-muted">Client</dt>
            <dd className="font-medium text-ink">{e.customerName}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-20 shrink-0 text-muted">Phone</dt>
            <dd>
              <a href={`tel:${e.customerPhone}`} className="inline-flex items-center gap-1.5 font-semibold text-accent">
                <Phone className="h-3.5 w-3.5" /> {e.customerPhone}
              </a>
            </dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-20 shrink-0 text-muted">Where</dt>
            <dd className="text-ink">
              <span className="inline-flex items-center gap-1.5"><ModeIcon className="h-3.5 w-3.5 text-muted" /> {MODE_LABEL[e.mode] ?? e.mode}</span>
              {e.address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-start gap-1.5 text-xs text-muted hover:text-ink"
                >
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {e.address}
                </a>
              )}
            </dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-20 shrink-0 text-muted">Payment</dt>
            <dd className="text-ink tabular-nums">
              {formatINR(e.pricePaise)} · {e.paymentMode === "online" ? "Online" : "Pay at session"} <span className="text-muted">({e.paymentStatus.replace("_", " ")})</span>
            </dd>
          </div>
          {e.notes && (
            <div className="flex gap-3">
              <dt className="w-20 shrink-0 text-muted">Notes</dt>
              <dd className="flex items-start gap-1.5 text-ink"><StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" /> {e.notes}</dd>
            </div>
          )}
          <div className="flex gap-3">
            <dt className="w-20 shrink-0 text-muted">Ref</dt>
            <dd className="font-mono text-xs text-muted">{e.number}</dd>
          </div>
        </dl>

        {e.status === "confirmed" && (
          <div className="mt-6 border-t border-line pt-4">
            <p className="mb-2 text-xs text-muted">{start <= new Date() ? "Session started. Mark how it went to release payment." : "You can cancel; the client is told and refunded if they paid online."}</p>
            <SessionActions slug={slug} bookingId={e.id} started={start <= new Date()} />
          </div>
        )}
      </div>
    </div>
  );
}
