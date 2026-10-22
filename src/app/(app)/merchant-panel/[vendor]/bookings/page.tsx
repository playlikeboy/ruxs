import Link from "next/link";
import { Clock } from "lucide-react";
import { requireVendorModule } from "@/lib/auth/session";
import { formatINR } from "@/core/money";
import { addDaysIST, istDateTime, todayIST, weekdayIST } from "@/core/time";
import { gridHours, hhmmToMinutes, istMinutes, parseDateParam, weekDates, weekStartIST } from "@/core/calendar";
import { getProviderBookingList, getProviderCalendar } from "@/features/bookings/queries";
import { BookingCalendar, type CalEvent, type CalView, type ListTab } from "@/features/bookings/components/booking-calendar";
import { PageHeader } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";

export const metadata = { title: "Calendar" };

type Row = Awaited<ReturnType<typeof getProviderCalendar>>["rows"][number];

function toEvent({ booking: b, customerName, customerPhone, serviceName }: Row): CalEvent {
  return {
    id: b.id,
    number: b.number,
    start: b.startsAt.toISOString(),
    end: b.endsAt.toISOString(),
    status: b.status,
    mode: b.mode,
    address: b.address,
    pricePaise: b.pricePaise,
    paymentMode: b.paymentMode,
    paymentStatus: b.paymentStatus,
    notes: b.notes,
    customerName,
    customerPhone,
    serviceName,
  };
}

export default async function BookingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ vendor: string }>;
  searchParams: Promise<{ view?: string; date?: string; tab?: string }>;
}) {
  const { vendor: slug } = await params;
  await requireVendorModule(slug, "bookings");
  const q = await searchParams;
  const view: CalView = q.view === "day" || q.view === "list" ? q.view : "week";
  const tab: ListTab = q.tab === "past" || q.tab === "cancelled" ? q.tab : "upcoming";
  const today = todayIST();
  const date = parseDateParam(q.date);
  const days = view === "day" ? [date] : weekDates(weekStartIST(date));
  const step = view === "day" ? 1 : 7;

  // The calendar always loads the visible range; the list loads its tab.
  const [cal, list, week] = await Promise.all([
    getProviderCalendar(slug, days[0]!, days[days.length - 1]!),
    view === "list" ? getProviderBookingList(slug, tab) : null,
    view === "week" ? null : getProviderCalendar(slug, weekStartIST(today), addDaysIST(weekStartIST(today), 6)),
  ]);

  const events = (list ? list.rows : cal.rows).map(toEvent);
  const openHours: Record<string, { start: number; end: number }[]> = {};
  for (const d of days) {
    const wd = weekdayIST(d);
    openHours[d] = cal.rules.filter((r) => r.weekday === wd).map((r) => ({ start: hhmmToMinutes(r.startTime), end: hhmmToMinutes(r.endTime) }));
  }
  const timeOff = cal.blocks.flatMap((b) =>
    days
      .filter((d) => b.startsAt < istDateTime(addDaysIST(d, 1), "00:00") && b.endsAt > istDateTime(d, "00:00"))
      .map((d) => ({
        date: d,
        start: todayIST(b.startsAt) === d ? istMinutes(b.startsAt) : 0,
        end: todayIST(b.endsAt) === d ? istMinutes(b.endsAt) : 1440,
        reason: b.reason,
      }))
  );
  const hours = gridHours(cal.rules, cal.rows.map((r) => ({ start: istMinutes(r.booking.startsAt), end: istMinutes(r.booking.endsAt) || 1440 })));

  // This week at a glance, whatever range is on screen.
  const weekRows = (week ?? cal).rows.filter((r) => r.booking.status !== "cancelled");
  const stats = {
    sessions: weekRows.length,
    value: weekRows.reduce((s, r) => s + r.booking.pricePaise, 0),
    done: weekRows.filter((r) => r.booking.status === "done").length,
    noShow: weekRows.filter((r) => r.booking.status === "no_show").length,
  };

  const first = new Date(days[0]! + "T12:00:00+05:30");
  const last = new Date(days[days.length - 1]! + "T12:00:00+05:30");
  const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-IN", { ...o, timeZone: "Asia/Kolkata" });
  const rangeLabel =
    view === "day"
      ? fmt(first, { weekday: "long", day: "numeric", month: "long" })
      : `${fmt(first, { day: "numeric", month: "short" })} – ${fmt(last, { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <PageHeader
        eyebrow="Bookings"
        title="Calendar"
        description="Every session in one place. Tap a booking to call, get directions or mark it done."
        action={
          <Link href={`/merchant-panel/${slug}/availability`} className={buttonClass("secondary", "sm")}>
            <Clock className="h-4 w-4" aria-hidden="true" /> Hours & time off
          </Link>
        }
      />

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { k: "This week", v: String(stats.sessions), s: "sessions booked" },
          { k: "Booked value", v: formatINR(stats.value), s: "this week" },
          { k: "Completed", v: String(stats.done), s: "marked done" },
          { k: "No-shows", v: String(stats.noShow), s: "this week" },
        ].map((x) => (
          <div key={x.k} className="rounded-card border border-line bg-surface px-3.5 py-3">
            <dt className="text-xs text-muted">{x.k}</dt>
            <dd className="mt-0.5 text-xl font-semibold tabular-nums text-ink">{x.v}</dd>
            <dd className="text-[11px] text-muted">{x.s}</dd>
          </div>
        ))}
      </dl>

      <BookingCalendar
        slug={slug}
        view={view}
        date={date}
        today={today}
        days={days}
        prev={addDaysIST(date, -step)}
        next={addDaysIST(date, step)}
        rangeLabel={rangeLabel}
        events={events}
        openHours={openHours}
        timeOff={timeOff}
        hours={hours}
        tab={tab}
      />

      <p className="text-xs text-muted">Online payments go to RUXs and show in Earnings once you mark the session done.</p>
    </div>
  );
}
