import { UiIcon } from "@/components/ui/app-icon";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, MapPin, Video, Home } from "lucide-react";
import { formatINR } from "@/core/money";
import { MODE_LABEL, canCancelBooking, formatSlotTime } from "@/core/booking";
import { dayLabelIST, todayIST } from "@/core/time";
import { getMyBooking } from "@/features/bookings/queries";
import { PageHeader } from "@/features/consumer/components/page-header";
import { BookingStatus, PAYMENT_LABEL } from "@/features/bookings/components/booking-status";
import { CancelBookingButton } from "@/features/bookings/components/booking-buttons";
import { PayBookingButton } from "@/features/payments/components/pay-buttons";

export const metadata = { title: "Booking" };

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getMyBooking(id);
  if (!row) notFound();
  const { booking: b } = row;
  const now = new Date();
  const ModeIcon = b.mode === "home" ? Home : b.mode === "online" ? Video : MapPin;
  const holdLive = b.status === "held" && b.heldUntil != null && b.heldUntil > now;
  const cancellable = b.status === "held" || (b.status === "confirmed" && canCancelBooking(b.startsAt, now, row.cancelCutoffHours));

  return (
    <div className="min-h-dvh bg-neutral-50 pb-8">
      <PageHeader title={row.serviceName ?? "Session"} subtitle={b.number} back="/app/bookings" />
      <div className="space-y-4 p-4">
        <section className="rounded-2xl bg-ink p-5 text-white">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider opacity-70">Your session</p>
            <BookingStatus status={b.status} />
          </div>
          <p className="mt-2 text-2xl font-bold">{dayLabelIST(todayIST(b.startsAt))}</p>
          <p className="text-lg opacity-90">{formatSlotTime(b.startsAt)} – {formatSlotTime(b.endsAt)}{row.durationMinutes ? ` · ${row.durationMinutes} min` : ""}</p>
          <p className="mt-3 flex items-center gap-2 text-sm opacity-90">
            <ModeIcon className="h-4 w-4" aria-hidden="true" /> {MODE_LABEL[b.mode] ?? b.mode}
          </p>
          <p className="mt-1 text-sm opacity-70">
            {b.mode === "home" ? b.address : b.mode === "studio" ? `${row.vendorName}, ${row.vendorArea}, ${row.vendorCity}` : "The provider will share a video link before the session."}
          </p>
        </section>

        {b.status === "held" &&
          (holdLive ? (
            <section className="space-y-2 rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <p className="text-sm text-neutral-600">Your slot is held until {formatSlotTime(b.heldUntil!)}. Pay to confirm it.</p>
              <PayBookingButton bookingId={b.id} pricePaise={b.pricePaise} />
            </section>
          ) : (
            <p className="rounded-2xl bg-butter p-4 text-sm font-medium text-warn">The 15-minute hold ran out. Book again to get a slot.</p>
          ))}

        {b.status === "cancelled" && (
          <p className="rounded-2xl bg-white p-4 text-sm text-neutral-600 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">{b.cancelReason ?? "This session was cancelled."}</p>
        )}

        <section className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <h2 className="font-semibold text-ink">With</h2>
          <Link href={`/app/store/${row.vendorSlug}`} className="mt-1 block text-[15px] font-medium text-accent">{row.vendorName}</Link>
          <dl className="mt-4 space-y-1.5 border-t border-dashed border-black/10 pt-3 text-sm">
            <div className="flex justify-between text-neutral-600"><dt>Price</dt><dd className="tabular-nums text-ink">{formatINR(b.pricePaise)}</dd></div>
            <div className="flex justify-between text-neutral-600"><dt>Payment</dt><dd>{b.paymentMode === "online" ? "Online" : "At the session"} · {PAYMENT_LABEL[b.paymentStatus] ?? b.paymentStatus}</dd></div>
          </dl>
          {b.notes && <p className="mt-3 text-sm text-neutral-500">Your note: {b.notes}</p>}
        </section>

        {cancellable && (
          <div className="rounded-2xl bg-white p-4 text-center shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <CancelBookingButton bookingId={b.id} />
            <p className="mt-1 text-xs text-neutral-500">Free up to {row.cancelCutoffHours} h before the session.</p>
          </div>
        )}
        {b.status === "done" && (
          <Link href={`/app/store/${row.vendorSlug}#reviews`} className="flex h-12 items-center justify-center rounded-xl border border-black/10 bg-white text-sm font-semibold text-ink"><UiIcon name="star" /> Rate {row.vendorName}</Link>
        )}
        {["done", "cancelled", "no_show"].includes(b.status) && (
          <Link href={`/app/store/${row.vendorSlug}`} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-ink text-sm font-semibold text-white">
            <CalendarClock className="h-4 w-4" aria-hidden="true" /> Book again
          </Link>
        )}
      </div>
    </div>
  );
}
