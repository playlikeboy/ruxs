"use client";

import Link from "next/link";
import { formatINR } from "@/core/money";
import { MODE_LABEL, formatSlotTime } from "@/core/booking";
import { dayLabelIST, todayIST } from "@/core/time";
import { BookingStatus, PAYMENT_LABEL } from "./booking-status";
import { ExportButton, type ExportData } from "@/features/admin/components/export-button";

interface AdminBookingItem {
  booking: {
    id: string;
    number: string;
    mode: string;
    status: string;
    startsAt: Date;
    pricePaise: number;
    paymentMode: string;
    paymentStatus: string;
  };
  vendorName: string;
  vendorSlug: string;
  customerName: string;
  serviceName: string | null;
}

export function AdminBookingsList({ rows }: { rows: AdminBookingItem[] }) {
  const getExportData = (): ExportData => {
    return {
      headers: [
        "Booking Number",
        "Provider",
        "Customer",
        "Service",
        "Mode",
        "Date & Time",
        "Status",
        "Payment Mode",
        "Payment Status",
        "Fee (Rs)",
      ],
      rows: rows.map((r) => [
        r.booking.number,
        r.vendorName,
        r.customerName,
        r.serviceName || "Session",
        MODE_LABEL[r.booking.mode] || r.booking.mode,
        `${dayLabelIST(todayIST(new Date(r.booking.startsAt)))}, ${formatSlotTime(new Date(r.booking.startsAt))}`,
        r.booking.status,
        r.booking.paymentMode,
        r.booking.paymentStatus,
        (r.booking.pricePaise / 100).toFixed(2),
      ]),
    };
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ExportButton
          filename="ruxs-bookings"
          title="Export Bookings"
          getData={getExportData}
        />
      </div>

      <ul className="grid gap-3 lg:grid-cols-2">
        {rows.map(({ booking: b, vendorName, vendorSlug, customerName, serviceName }) => (
          <li key={b.id} className="space-y-2 rounded-[14px] border border-line bg-surface p-4 shadow-2xs">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-sm">
                  <Link href={`/merchant-panel/${vendorSlug}/bookings`} className="hover:underline text-ink">
                    {vendorName}
                  </Link>{" "}
                  → <span className="text-ink">{customerName}</span>
                </p>
                <p className="text-xs text-muted">
                  <span className="font-mono">{b.number}</span> · {serviceName ?? "Session"} · {MODE_LABEL[b.mode] ?? b.mode}
                </p>
              </div>
              <BookingStatus status={b.status} />
            </div>
            <div className="flex items-center justify-between text-sm border-t border-line/60 pt-2">
              <span className="text-muted text-xs">
                {dayLabelIST(todayIST(new Date(b.startsAt)))}, {formatSlotTime(new Date(b.startsAt))}
              </span>
              <span className="font-mono font-bold text-ink tabular-nums">{formatINR(b.pricePaise)}</span>
            </div>
            <p className="text-xs text-muted">
              {b.paymentMode === "online" ? "Online" : "At session"} · {PAYMENT_LABEL[b.paymentStatus] ?? b.paymentStatus}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
