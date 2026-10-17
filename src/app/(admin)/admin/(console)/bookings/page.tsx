import Link from "next/link";
import { formatINR } from "@/core/money";
import { MODE_LABEL, formatSlotTime } from "@/core/booking";
import { dayLabelIST, todayIST } from "@/core/time";
import { getAdminBookings } from "@/features/admin/queries";
import { BookingStatus, PAYMENT_LABEL } from "@/features/bookings/components/booking-status";

export const metadata = { title: "Bookings" };

const FILTERS = [
  { v: "", t: "All" },
  { v: "confirmed", t: "Upcoming" },
  { v: "held", t: "Awaiting payment" },
  { v: "done", t: "Completed" },
  { v: "no_show", t: "No-show" },
  { v: "cancelled", t: "Cancelled" },
];

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: raw } = await searchParams;
  const status = FILTERS.some((f) => f.v === raw) ? raw : "";
  const rows = await getAdminBookings(status || undefined);

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
        <p className="mt-1 text-sm text-muted">Sessions with trainers, physiotherapists and other booking providers. Read-only; refunds are on Payouts.</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {FILTERS.map((f) => (
          <Link key={f.t} href={f.v ? `/admin/bookings?status=${f.v}` : "/admin/bookings"} className={"shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium " + (status === f.v ? "border-ink bg-ink text-white" : "border-line bg-surface text-muted")}>
            {f.t}
          </Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="rounded-[12px] border border-line bg-surface p-8 text-center text-sm text-muted">No bookings here.</p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {rows.map(({ booking: b, vendorName, vendorSlug, customerName, serviceName }) => (
            <li key={b.id} className="space-y-2 rounded-[14px] border border-line bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold"><Link href={`/merchant-panel/${vendorSlug}/bookings`} className="hover:underline">{vendorName}</Link> → {customerName}</p>
                  <p className="text-xs text-muted"><span className="font-mono">{b.number}</span> · {serviceName ?? "Session"} · {MODE_LABEL[b.mode] ?? b.mode}</p>
                </div>
                <BookingStatus status={b.status} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">{dayLabelIST(todayIST(b.startsAt))}, {formatSlotTime(b.startsAt)}</span>
                <span className="font-mono font-bold tabular-nums">{formatINR(b.pricePaise)}</span>
              </div>
              <p className="text-xs text-muted">{b.paymentMode === "online" ? "Online" : "At session"} · {PAYMENT_LABEL[b.paymentStatus] ?? b.paymentStatus}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
