import Link from "next/link";
import { CalendarClock, ChevronRight } from "lucide-react";
import { formatINR } from "@/core/money";
import { MODE_LABEL, formatSlotTime } from "@/core/booking";
import { dayLabelIST, todayIST } from "@/core/time";
import { getMyBookings } from "@/features/bookings/queries";
import { PageHeader } from "@/features/consumer/components/page-header";
import { BookingStatus } from "@/features/bookings/components/booking-status";

export const metadata = { title: "Bookings" };

export default async function MyBookingsPage() {
  const rows = await getMyBookings();
  const now = new Date();
  const upcoming = rows.filter((r) => r.booking.endsAt > now && ["held", "confirmed"].includes(r.booking.status)).reverse();
  const past = rows.filter((r) => !upcoming.includes(r));

  const Row = ({ r }: { r: (typeof rows)[number] }) => (
    <li>
      <Link href={`/app/bookings/${r.booking.id}`} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] active:bg-neutral-50">
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-neutral-50 text-center">
          <span className="text-[10px] font-semibold uppercase text-neutral-500">{dayLabelIST(todayIST(r.booking.startsAt)).split(",")[0]}</span>
          <span className="text-sm font-bold text-ink">{formatSlotTime(r.booking.startsAt)}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink">{r.serviceName ?? "Session"}</p>
          <p className="truncate text-sm text-neutral-500">{r.vendorName} · {MODE_LABEL[r.booking.mode] ?? r.booking.mode}</p>
          <div className="mt-1 flex items-center gap-2">
            <BookingStatus status={r.booking.status} />
            <span className="text-xs text-neutral-500 tabular-nums">{formatINR(r.booking.pricePaise)}</span>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-neutral-300" aria-hidden="true" />
      </Link>
    </li>
  );

  return (
    <div className="min-h-dvh bg-neutral-50">
      <PageHeader title="Your bookings" subtitle="Trainers, physio and other sessions" />
      {rows.length === 0 ? (
        <div className="flex flex-col items-center px-6 pt-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sky">
            <CalendarClock className="h-9 w-9 text-[#1F5C99]" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-ink">No bookings yet</h2>
          <p className="mt-1.5 max-w-xs text-sm text-neutral-500">Book a trainer or physiotherapist near you at a time that suits you.</p>
          <Link href="/app/category/fitness" className="mt-6 inline-flex h-12 items-center rounded-xl bg-accent px-6 font-semibold text-white">Find a trainer</Link>
        </div>
      ) : (
        <div className="space-y-6 p-4">
          {upcoming.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">Upcoming</h2>
              <ul className="space-y-2">{upcoming.map((r) => <Row key={r.booking.id} r={r} />)}</ul>
            </section>
          )}
          {past.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">Past &amp; cancelled</h2>
              <ul className="space-y-2">{past.map((r) => <Row key={r.booking.id} r={r} />)}</ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
