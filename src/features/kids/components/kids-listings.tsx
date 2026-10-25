import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { formatINR } from "@/core/money";
import { providerStatusLabel, toCalendarStatus } from "@/core/kids/booking-status";
import type { getProviderKidsWorkspace } from "../queries";
import { KidsBookingActions } from "./provider-booking-actions";

type Workspace = Awaited<ReturnType<typeof getProviderKidsWorkspace>>;

const row = "flex items-center gap-3 rounded-[14px] border border-line bg-surface p-4 transition hover:border-ink/30";
const when = (d: Date) => d.toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

export function KidsClassList({ slug, services }: { slug: string; services: Workspace["services"] }) {
  if (services.length === 0) {
    return <EmptyState title="No classes yet" description="Add your first class. Parents nearby can book it as soon as it is saved." />;
  }
  return (
    <ul className="space-y-2">
      {services.map(({ service, category }) => (
        <li key={service.id}>
          <Link href={`/merchant-panel/${slug}/kids/classes/${service.id}`} className={row}>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ink">{service.title}</span>
              <span className="block text-xs text-muted">
                {category.name} · Ages {service.minAge}–{service.maxAge} · {service.durationMinutes} min
              </span>
            </span>
            <span className="text-sm font-semibold tabular-nums text-ink">{formatINR(service.pricePaise)}</span>
            <ChevronRight className="h-4 w-4 text-muted" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function KidsWorkshopList({ slug, workshops }: { slug: string; workshops: Workspace["workshops"] }) {
  if (workshops.length === 0) {
    return <EmptyState title="No workshops yet" description="Run a weekend or holiday camp with a fixed number of seats." />;
  }
  return (
    <ul className="space-y-2">
      {workshops.map(({ workshop, category }) => (
        <li key={workshop.id}>
          <Link href={`/merchant-panel/${slug}/kids/workshops/${workshop.id}`} className={row}>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ink">{workshop.title}</span>
              <span className="block text-xs text-muted">
                {category.name} · {workshop.startDate} to {workshop.endDate} · {workshop.capacity} seats
              </span>
            </span>
            <span className="text-sm font-semibold tabular-nums text-ink">{formatINR(workshop.pricePaise)}</span>
            <ChevronRight className="h-4 w-4 text-muted" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Who is coming: each child with the parent's notes, so the session starts prepared. */
export function KidsChildrenList({ slug, bookings, enrollments }: { slug: string; bookings: Workspace["bookings"]; enrollments: Workspace["enrollments"] }) {
  if (bookings.length === 0 && enrollments.length === 0) {
    return <EmptyState title="No children booked yet" description="Bookings and workshop sign-ups show here with each parent's notes." />;
  }
  return (
    <ul className="space-y-2">
      {bookings.map(({ booking, service, child }) => {
        const startsAt = new Date(booking.startsAt);
        return (
          <li key={booking.id} className="flex flex-col gap-3 rounded-[14px] border border-line bg-surface p-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">
                {child.displayName}
                {child.schoolClass && <span className="font-normal text-muted"> · {child.schoolClass}</span>}
              </p>
              <p className="text-xs text-muted">
                {service?.title ?? "Session"} · {when(startsAt)} · {providerStatusLabel(booking.bookingStatus, startsAt)}
              </p>
              {child.activityNotes && <p className="mt-2 rounded-[10px] bg-butter px-3 py-2 text-xs text-warn">Parent note: {child.activityNotes}</p>}
            </div>
            <KidsBookingActions slug={slug} bookingId={booking.id} status={toCalendarStatus(booking.bookingStatus, startsAt)} started={startsAt <= new Date()} />
          </li>
        );
      })}
      {enrollments.map(({ enrollment, workshop, child }) => (
        <li key={enrollment.id} className="rounded-[14px] border border-line bg-surface p-4">
          <p className="text-sm font-semibold text-ink">
            {child.displayName}
            {child.schoolClass && <span className="font-normal text-muted"> · {child.schoolClass}</span>}
          </p>
          <p className="text-xs text-muted">
            Workshop: {workshop.title} · starts {workshop.startDate} · <span className="capitalize">{enrollment.status}</span>
          </p>
          {child.activityNotes && <p className="mt-2 rounded-[10px] bg-butter px-3 py-2 text-xs text-warn">Parent note: {child.activityNotes}</p>}
        </li>
      ))}
    </ul>
  );
}
