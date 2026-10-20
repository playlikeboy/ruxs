"use client";

import Link from "next/link";
import { formatINR } from "@/core/money";
import { StatusPill } from "@/features/consumer/components/status-pill";
import { dayLabelIST } from "@/core/time";
import { ExportButton, type ExportData } from "@/features/admin/components/export-button";

const timeFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

interface OrderItem {
  id: string;
  name: string;
  qty: number;
  unitPricePaise?: number;
}

interface AdminOrderRow {
  order: {
    id: string;
    number: string;
    createdAt: Date;
    paymentMode: string;
    paymentStatus: string;
    status: string;
    deliverOn: string;
    address: string;
    totalPaise: number;
  };
  items: OrderItem[];
  vendorName: string;
  vendorSlug: string;
  customerName: string;
}

export function AdminOrdersList({ orders }: { orders: AdminOrderRow[] }) {
  const getExportData = (): ExportData => {
    return {
      headers: [
        "Order Number",
        "Date",
        "Store",
        "Customer",
        "Items",
        "Delivery Date",
        "Delivery Address",
        "Payment Mode",
        "Payment Status",
        "Order Status",
        "Total (Rs)",
      ],
      rows: orders.map((o) => [
        o.order.number,
        timeFmt.format(new Date(o.order.createdAt)),
        o.vendorName,
        o.customerName,
        o.items.map((i) => `${i.qty}x ${i.name}`).join("; "),
        o.order.deliverOn,
        o.order.address,
        o.order.paymentMode,
        o.order.paymentStatus,
        o.order.status,
        (o.order.totalPaise / 100).toFixed(2),
      ]),
    };
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ExportButton
          filename="ruxs-orders"
          title="Export Orders"
          getData={getExportData}
        />
      </div>

      <ul className="grid gap-3 lg:grid-cols-2">
        {orders.map(({ order, items, vendorName, vendorSlug, customerName }) => (
          <li key={order.id} className="space-y-3 rounded-[14px] border border-line bg-surface p-4 shadow-2xs">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-sm">
                  <Link href={`/merchant-panel/${vendorSlug}/orders`} className="hover:underline text-ink">
                    {vendorName}
                  </Link>{" "}
                  → <span className="text-ink">{customerName}</span>
                </p>
                <p className="text-xs text-muted">
                  <span className="font-mono">{order.number}</span> · {timeFmt.format(new Date(order.createdAt))} ·{" "}
                  {order.paymentMode === "online"
                    ? `Online · ${order.paymentStatus.replace("_", " ")}`
                    : order.paymentMode === "cod"
                    ? "Cash on delivery"
                    : "Monthly bill"}
                </p>
              </div>
              <StatusPill status={order.status} />
            </div>
            <p className="text-sm text-muted">
              {items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
            </p>
            <div className="flex items-center justify-between border-t border-line/60 pt-2">
              <span className="text-xs text-muted">
                {dayLabelIST(order.deliverOn)} · {order.address.slice(0, 50)}
              </span>
              <span className="font-mono font-bold text-ink tabular-nums">
                {formatINR(order.totalPaise)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
