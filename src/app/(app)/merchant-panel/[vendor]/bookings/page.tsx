import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarClock, Phone } from "lucide-react";
import { MODE_LABEL, formatSlotTime } from "@/core/booking";
import { dayLabelIST, todayIST } from "@/core/time";
import { getProviderSchedule } from "@/features/bookings/queries";
import { SessionActions } from "@/features/bookings/components/booking-buttons";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Bookings" };

const STATUS_TONE: Record<string, string> = {
  confirmed: "bg-sky text-[#1F5C99]",
  done: "bg-mint text-good",
  no_show: "bg-blush text-bad",
};

export default async function BookingsPage({ params }: { params: Promise<{ vendor: string }> }) {
  const { vendor: slug } = await params;
  const { access, rows } = await getProviderSchedule(slug, 14);
  if (access.vendor.businessType !== "booking") redirect(`/merchant-panel/${slug}/orders`);
  const now = new Date();
  const days = new Map<string, typeof rows>();
  for (const r of rows) {
    const d = todayIST(r.booking.startsAt);
    days.set(d, [...(days.get(d) ?? []), r]);
  }

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Bookings</h1>
          <p className="mt-0.5 text-sm text-muted">Your sessions for the next two weeks. Mark each one done after it ends to get paid.</p>
        </div>
        <Link href={`/merchant-panel/${slug}/availability`} className="flex h-10 items-center gap-2 rounded-[10px] border border-line bg-surface px-4 text-sm font-semibold">
          <CalendarClock className="h-4 w-4" aria-hidden="true" /> Edit availability
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No sessions booked yet" description="Set your weekly hours in Availability. Clients near you can then book your free times." />
      ) : (
        Array.from(days.entries()).map(([date, list]) => (
          <section key={date} className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">{dayLabelIST(date)}</h2>
            <ul className="grid gap-3 lg:grid-cols-2">
              {list.map(({ booking, customerName, customerPhone, serviceName }) => (
                <li key={booking.id} className="rounded-[14px] border border-line bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-lg font-bold tabular-nums text-ink">
                        {formatSlotTime(booking.startsAt)} – {formatSlotTime(booking.endsAt)}
                      </p>
                      <p className="truncate font-semibold text-ink">{customerName}</p>
                      <p className="truncate text-xs text-muted">{serviceName ?? "Session"} · {MODE_LABEL[booking.mode] ?? booking.mode}</p>
                    </div>
                    <span className={"shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize " + (STATUS_TONE[booking.status] ?? "")}>{booking.status.replace("_", "-")}</span>
                  </div>
                  {booking.address && <p className="mt-2 rounded-[10px] bg-bg px-3 py-2 text-xs text-muted">{booking.address}</p>}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <a href={`tel:${customerPhone}`} className="flex items-center gap-1 text-xs font-semibold text-ink"><Phone className="h-3.5 w-3.5" /> {customerPhone}</a>
                    {booking.status === "confirmed" && <SessionActions slug={slug} bookingId={booking.id} started={booking.startsAt <= now} />}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
      <p className="text-xs text-muted">Payments: online sessions are paid to RUXs and show in Earnings after you mark them done.</p>
    </div>
  );
}
