"use client";

import Link from "next/link";
import { formatINR } from "@/core/money";
import { InvoiceStatusPill } from "./invoice-status-pill";
import { MarkPaidButton, RegenerateInvoiceButton } from "./admin-invoice-actions";
import { ExportButton, type ExportData } from "@/features/admin/components/export-button";

interface InvoiceRowItem {
  invoice: {
    id: string;
    period: string;
    number: string;
    openingPaise: number;
    chargesPaise: number;
    paymentsPaise: number;
    closingPaise: number;
    status: string;
    createdAt: Date;
  };
  vendor: {
    id: string;
    name: string;
    slug: string;
    city: string;
    phone: string;
  };
  customer: {
    id: string;
    name: string;
    phone: string;
    flat: string;
    tower: string;
    society: string;
  };
}

export function AdminInvoicesTable({
  rows,
}: {
  rows: InvoiceRowItem[];
}) {
  const getExportData = (): ExportData => {
    return {
      headers: [
        "Invoice Number",
        "Period",
        "Vendor",
        "Vendor Phone",
        "Customer",
        "Customer Phone",
        "Address",
        "Opening (Rs)",
        "Charges (Rs)",
        "Payments (Rs)",
        "Closing (Rs)",
        "Status",
        "Date",
      ],
      rows: rows.map((r) => [
        r.invoice.number,
        r.invoice.period,
        r.vendor.name,
        r.vendor.phone,
        r.customer.name,
        r.customer.phone,
        `${r.customer.flat}, ${r.customer.tower !== "-" ? r.customer.tower + ", " : ""}${r.customer.society}`,
        (r.invoice.openingPaise / 100).toFixed(2),
        (r.invoice.chargesPaise / 100).toFixed(2),
        (r.invoice.paymentsPaise / 100).toFixed(2),
        (r.invoice.closingPaise / 100).toFixed(2),
        r.invoice.status,
        new Date(r.invoice.createdAt).toLocaleDateString("en-IN"),
      ]),
    };
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ExportButton
          filename="ruxs-invoices"
          title="Export Invoices"
          getData={getExportData}
        />
      </div>

      {/* Mobile view */}
      <ul className="space-y-3 md:hidden">
        {rows.map(({ invoice, vendor, customer }) => (
          <li
            key={invoice.id}
            className="rounded-[14px] border border-line bg-surface p-4 shadow-2xs space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link
                  href={`/admin/invoices/${invoice.id}`}
                  className="font-mono text-xs font-bold text-ink hover:underline"
                >
                  {invoice.number}
                </Link>
                <p className="text-xs text-muted">
                  Period: <span className="font-semibold text-ink">{invoice.period}</span>
                </p>
              </div>
              <InvoiceStatusPill status={invoice.status} />
            </div>

            <div className="text-xs space-y-0.5">
              <p className="font-medium text-ink">
                Vendor: <span className="text-muted">{vendor.name}</span>
              </p>
              <p className="font-medium text-ink">
                Customer: <span className="text-muted">{customer.name} ({customer.flat}, {customer.society})</span>
              </p>
            </div>

            <div className="grid grid-cols-3 gap-1 rounded-[10px] bg-bg p-2 text-center text-xs">
              <div>
                <p className="text-[10px] text-muted uppercase">Billed</p>
                <p className="font-mono font-semibold">{formatINR(invoice.chargesPaise)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase">Paid</p>
                <p className="font-mono font-semibold text-good">{formatINR(invoice.paymentsPaise)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase">Balance</p>
                <p className={"font-mono font-bold " + (invoice.closingPaise > 0 ? "text-bad" : "text-ink")}>
                  {formatINR(invoice.closingPaise)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-line/60">
              <Link
                href={`/admin/invoices/${invoice.id}`}
                className="text-xs font-semibold text-accent hover:underline"
              >
                View details →
              </Link>
              <div className="flex items-center gap-2">
                <RegenerateInvoiceButton invoiceId={invoice.id} />
                <MarkPaidButton invoiceId={invoice.id} isPaid={invoice.status === "paid"} />
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop view */}
      <div className="hidden overflow-x-auto rounded-[14px] border border-line bg-surface md:block shadow-2xs">
        <table className="w-full min-w-[840px] text-left text-sm">
          <thead className="border-b border-line bg-bg text-[11px] uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Invoice #</th>
              <th className="px-4 py-3 font-semibold">Period</th>
              <th className="px-4 py-3 font-semibold">Vendor</th>
              <th className="px-4 py-3 font-semibold">Household</th>
              <th className="px-4 py-3 text-right font-semibold">Charges</th>
              <th className="px-4 py-3 text-right font-semibold">Paid</th>
              <th className="px-4 py-3 text-right font-semibold">Balance</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map(({ invoice, vendor, customer }) => (
              <tr key={invoice.id} className="transition-colors hover:bg-bg/60">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/invoices/${invoice.id}`}
                    className="font-mono text-xs font-bold text-ink hover:underline"
                  >
                    {invoice.number}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted">{invoice.period}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-ink text-xs">{vendor.name}</p>
                  <p className="text-[11px] text-muted">{vendor.city}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-ink text-xs">{customer.name}</p>
                  <p className="text-[11px] text-muted">
                    {customer.flat}, {customer.society}
                  </p>
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs font-medium tabular-nums">
                  {formatINR(invoice.chargesPaise)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs font-medium text-good tabular-nums">
                  {formatINR(invoice.paymentsPaise)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs font-bold tabular-nums">
                  <span className={invoice.closingPaise > 0 ? "text-bad" : "text-ink"}>
                    {formatINR(invoice.closingPaise)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <InvoiceStatusPill status={invoice.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      href={`/admin/invoices/${invoice.id}`}
                      className="rounded-[6px] border border-line bg-surface px-2 py-1 text-xs font-medium text-ink hover:bg-bg transition"
                    >
                      View
                    </Link>
                    <RegenerateInvoiceButton invoiceId={invoice.id} />
                    <MarkPaidButton invoiceId={invoice.id} isPaid={invoice.status === "paid"} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
