import Link from "next/link";
import { ArrowRight, CalendarClock, Clock, Star, Wallet } from "lucide-react";
import { formatINR } from "@/core/money";
import { MODE_LABEL, formatSlotTime } from "@/core/booking";
import { todayIST } from "@/core/time";
import { getProviderSchedule } from "@/features/bookings/queries";
import { computeVendorBalance } from "@/features/payouts/queries";
import { getRatingMap } from "@/features/platform/queries";
import { SessionActions } from "./booking-buttons";
import { ProviderSessionSheet } from "./provider-session-sheet";

/** Merchant Today for booking providers: today's sessions, what's next, and money. */
export async function ProviderToday({ slug }: { slug: string }) {
  const { access, rows } = await getProviderSchedule(slug, 14);
  const [balance, rating] = await Promise.all([
    access.role === "driver" ? null : computeVendorBalance(access.vendorId, access.vendor.commissionBps),
    getRatingMap(),
  ]);
  const today = todayIST();
  const now = new Date();
  const todays = rows.filter((r) => todayIST(r.booking.startsAt) === today);
  const upcoming = rows.filter((r) => r.booking.startsAt > now && r.booking.status === "confirmed");
  const next = upcoming[0];
  const toClose = rows.filter((r) => r.booking.status === "confirmed" && r.booking.startsAt <= now);
  const base = `/merchant-panel/${slug}`;
  const r = rating(access.vendorId);
  const dateLabel = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" });

  const kpis = [
    { label: "Sessions today", value: String(todays.length), sub: `${todays.filter((x) => x.booking.status === "done").length} completed`, href: `${base}/bookings`, icon: CalendarClock },
    { label: "Upcoming (14 days)", value: String(upcoming.length), sub: next ? `Next ${formatSlotTime(next.booking.startsAt)}` : "No upcoming sessions", href: `${base}/bookings`, icon: Clock },
    { label: "Rating", value: r.average == null ? "New" : r.average.toFixed(1), sub: `${r.count} reviews`, href: `${base}/reviews`, icon: Star },
    ...(balance ? [{ label: "Available to withdraw", value: formatINR(balance.availablePaise), sub: balance.pendingPaise ? `${formatINR(balance.pendingPaise)} pending` : "Online payments", href: `${base}/earnings`, icon: Wallet }] : []),
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{dateLabel}</p>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Today at {access.vendor.name}</h1>
        </div>
        <Link href={`${base}/availability`} className="flex h-11 items-center gap-2 rounded-[12px] border border-line bg-surface px-4 text-sm font-semibold">
          <Clock className="h-4 w-4" aria-hidden="true" /> Edit availability
        </Link>
      </div>

      {toClose.length > 0 && (
        <Link href={`${base}/bookings`} className="flex items-center gap-3 rounded-[16px] border border-accent/30 bg-peach p-4">
          <CalendarClock className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
          <span className="flex-1 text-sm">
            <span className="block font-semibold text-ink">{toClose.length} {toClose.length === 1 ? "session needs" : "sessions need"} closing</span>
            <span className="block text-muted">Mark them done or no-show so online payments reach your earnings.</span>
          </span>
          <ArrowRight className="h-5 w-5 text-accent" aria-hidden="true" />
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href} className="group rounded-[16px] border border-line bg-surface p-4 transition hover:border-ink/30 hover:shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted">{k.label}</p>
              <k.icon className="h-4 w-4 text-muted group-hover:text-ink" aria-hidden="true" />
            </div>
            <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-ink sm:text-3xl">{k.value}</p>
            <p className="mt-0.5 text-xs text-muted">{k.sub}</p>
          </Link>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Today&apos;s sessions</h2>
          <Link href={`${base}/bookings`} className="text-sm font-semibold text-accent">All bookings →</Link>
        </div>
        {todays.length === 0 ? (
          <p className="rounded-[16px] border border-dashed border-line bg-surface p-6 text-center text-sm text-muted">No sessions today. Keep your weekly hours up to date so clients can book.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {todays.map(({ booking, customerName, serviceName }) => (
              <li key={booking.id} className="rounded-[16px] border border-line bg-surface p-4">
                <p className="font-mono text-lg font-bold tabular-nums text-ink">{formatSlotTime(booking.startsAt)} – {formatSlotTime(booking.endsAt)}</p>
                <p className="truncate font-semibold text-ink">{customerName}</p>
                <p className="truncate text-xs text-muted">{serviceName ?? "Session"} · {MODE_LABEL[booking.mode] ?? booking.mode} · <span className="capitalize">{booking.status.replace("_", "-")}</span></p>
                {booking.status === "confirmed" && access.role !== "driver" && (
                  <div className="mt-3"><SessionActions slug={slug} bookingId={booking.id} started={booking.startsAt <= now} /></div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Differentiated Intake & Coordination Log */}
      <ProviderSessionSheet
        sessions={todays.map((t) => ({
          booking: t.booking,
          customerName: t.customerName,
          customerPhone: t.customerPhone,
          serviceName: t.serviceName,
          category: access.vendor.categoryId,
        }))}
        category={access.vendor.categoryId}
      />
    </div>
  );
}
