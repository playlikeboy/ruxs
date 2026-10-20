"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, QrCode } from "lucide-react";
import { formatINR } from "@/core/money";
import { PrintInvoiceButton, MarkPaidButton, RegenerateInvoiceButton } from "./admin-invoice-actions";
import { InvoiceStatusPill } from "./invoice-status-pill";
import { buildUpiUrl } from "@/core/upi";

interface InvoiceDetailProps {
  invoice: {
    id: string;
    number: string;
    period: string;
    openingPaise: number;
    chargesPaise: number;
    paymentsPaise: number;
    closingPaise: number;
    status: string;
    paidAt: Date | null;
    createdAt: Date;
  };
  vendor: {
    id: string;
    name: string;
    phone: string;
    upiVpa: string;
    city: string;
    area: string;
  };
  customer: {
    id: string;
    name: string;
    phone: string;
    flat: string;
    tower: string;
    floor: string;
    society: string;
  };
  entries: {
    id: string;
    type: string;
    amountPaise: number;
    notes: string | null;
    createdAt: Date;
  }[];
}

export function InvoicePrintableView({ invoice, vendor, customer, entries }: InvoiceDetailProps) {
  const upiUrl =
    vendor.upiVpa && invoice.closingPaise > 0
      ? buildUpiUrl({
          vpa: vendor.upiVpa,
          payeeName: vendor.name,
          amountPaise: invoice.closingPaise,
          billNumber: invoice.number,
        })
      : null;

  return (
    <div className="space-y-6">
      {/* Top action bar - hidden during print */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/admin/invoices"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink transition"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to Invoices</span>
        </Link>

        <div className="flex items-center gap-2">
          <RegenerateInvoiceButton invoiceId={invoice.id} />
          <MarkPaidButton invoiceId={invoice.id} isPaid={invoice.status === "paid"} />
          <PrintInvoiceButton />
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div className="rounded-[16px] border border-line bg-surface p-6 sm:p-10 shadow-sm print:border-none print:shadow-none print:p-0">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-6 border-b border-line pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-ink text-sm font-black text-white">
                R
              </span>
              <span className="text-xl font-bold tracking-tight text-ink">RUXs</span>
            </div>
            <p className="mt-1 text-xs text-muted">Daily essentials &amp; local services marketplace</p>
            <p className="text-xs text-muted">https://ruxs.in</p>
          </div>

          <div className="text-right">
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">TAX INVOICE</h1>
            <p className="mt-1 font-mono text-sm font-semibold text-muted">#{invoice.number}</p>
            <div className="mt-2 flex items-center justify-end gap-2">
              <span className="text-xs text-muted">Status:</span>
              <InvoiceStatusPill status={invoice.status} />
            </div>
          </div>
        </div>

        {/* Addresses & Period Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-6 border-b border-line text-xs">
          <div>
            <p className="font-semibold uppercase tracking-wider text-muted">Billed By (Merchant)</p>
            <p className="mt-1.5 font-bold text-sm text-ink">{vendor.name}</p>
            <p className="text-muted">{vendor.area}, {vendor.city}</p>
            <p className="mt-0.5 text-muted">Phone: <span className="font-mono text-ink">{vendor.phone}</span></p>
            {vendor.upiVpa && (
              <p className="text-muted">UPI: <span className="font-mono text-ink">{vendor.upiVpa}</span></p>
            )}
          </div>

          <div>
            <p className="font-semibold uppercase tracking-wider text-muted">Billed To (Household)</p>
            <p className="mt-1.5 font-bold text-sm text-ink">{customer.name}</p>
            <p className="text-muted">
              {customer.flat}{customer.tower !== "-" ? `, ${customer.tower}` : ""}{customer.floor ? ` (Floor ${customer.floor})` : ""}
            </p>
            <p className="text-muted">{customer.society}</p>
            <p className="mt-0.5 text-muted">Phone: <span className="font-mono text-ink">{customer.phone}</span></p>
          </div>

          <div className="sm:text-right space-y-1">
            <p className="font-semibold uppercase tracking-wider text-muted">Invoice Details</p>
            <p className="mt-1.5 text-muted">
              Billing Period: <span className="font-bold text-ink">{invoice.period}</span>
            </p>
            <p className="text-muted">
              Generated: <span className="text-ink">{new Date(invoice.createdAt).toLocaleDateString("en-IN")}</span>
            </p>
            {invoice.paidAt && (
              <p className="text-good font-semibold">
                Paid on: {new Date(invoice.paidAt).toLocaleDateString("en-IN")}
              </p>
            )}
          </div>
        </div>

        {/* Ledger Entries / Line Items */}
        <div className="py-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Itemized Statement</h2>
          {entries.length === 0 ? (
            <p className="rounded-[10px] bg-bg p-4 text-center text-xs text-muted">
              No itemized ledger transactions recorded in this period.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-line bg-bg/50 text-muted uppercase">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Date</th>
                    <th className="py-2.5 px-3 font-semibold">Activity</th>
                    <th className="py-2.5 px-3 font-semibold">Notes</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {entries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="py-2.5 px-3 text-muted">
                        {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="py-2.5 px-3 font-medium capitalize text-ink">
                        {entry.type.replace("_", " ")}
                      </td>
                      <td className="py-2.5 px-3 text-muted max-w-xs truncate">
                        {entry.notes || "—"}
                      </td>
                      <td
                        className={
                          "py-2.5 px-3 text-right font-mono font-semibold tabular-nums " +
                          (entry.amountPaise < 0 ? "text-good" : "text-ink")
                        }
                      >
                        {formatINR(entry.amountPaise)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Calculation Summary */}
        <div className="border-t border-line pt-6 flex flex-col sm:flex-row items-start justify-between gap-6">
          <div className="max-w-xs text-xs space-y-2">
            <p className="font-semibold text-muted uppercase tracking-wider">Payment Instructions</p>
            <p className="text-muted leading-relaxed">
              Payments can be made via UPI directly to the merchant. Please quote invoice number{" "}
              <span className="font-mono font-bold text-ink">{invoice.number}</span> as transaction reference.
            </p>
            {upiUrl && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-[8px] border border-line bg-bg px-2.5 py-1.5 text-[11px] font-mono text-ink">
                <QrCode className="h-4 w-4 text-accent" aria-hidden="true" />
                <span>UPI: {vendor.upiVpa}</span>
              </div>
            )}
          </div>

          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-muted">
              <span>Opening Balance:</span>
              <span className="font-mono tabular-nums">{formatINR(invoice.openingPaise)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Current Charges:</span>
              <span className="font-mono tabular-nums">{formatINR(invoice.chargesPaise)}</span>
            </div>
            <div className="flex justify-between text-good">
              <span>Payments Received:</span>
              <span className="font-mono tabular-nums">-{formatINR(invoice.paymentsPaise)}</span>
            </div>
            <div className="border-t border-line pt-2 flex justify-between text-sm font-bold text-ink">
              <span>Closing Net Payable:</span>
              <span className={"font-mono text-base " + (invoice.closingPaise > 0 ? "text-bad" : "text-good")}>
                {formatINR(invoice.closingPaise)}
              </span>
            </div>

            {invoice.status === "paid" && (
              <div className="mt-3 rounded-[8px] bg-good/10 p-2 text-center text-xs font-semibold text-good flex items-center justify-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Invoice Paid in Full
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 border-t border-line/60 pt-4 text-center text-[11px] text-muted print:block">
          This is a computer generated invoice by RUXs Platform on behalf of {vendor.name}. No signature required.
        </div>
      </div>
    </div>
  );
}
