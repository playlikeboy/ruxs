"use client";

import { Flag, ShieldAlert } from "lucide-react";
import { RaiseTicketModal } from "./raise-ticket-modal";

export function ReportReviewButton({
  reviewId,
  vendorId,
  vendorName,
}: {
  reviewId: string;
  vendorId?: string | null;
  vendorName?: string | null;
}) {
  return (
    <RaiseTicketModal
      defaultCategory="report_review"
      lockCategory={true}
      reviewId={reviewId}
      vendorId={vendorId}
      vendorName={vendorName}
      modalTitle="Report Inappropriate Review"
      triggerVariant="compact"
      triggerText="Report"
      triggerIcon={<Flag className="h-3 w-3 text-neutral-400 group-hover:text-rose-500" aria-hidden="true" />}
      triggerClassName="group inline-flex items-center gap-1 text-[11px] font-medium text-neutral-400 hover:text-rose-600 transition-colors"
    />
  );
}

export function ReportStoreButton({
  vendorId,
  vendorName,
}: {
  vendorId: string;
  vendorName: string;
}) {
  return (
    <RaiseTicketModal
      defaultCategory="report_store"
      lockCategory={true}
      vendorId={vendorId}
      vendorName={vendorName}
      modalTitle={`Report Store: ${vendorName}`}
      triggerVariant="compact"
      triggerText="Report store"
      triggerIcon={<Flag className="h-3.5 w-3.5 text-neutral-400" aria-hidden="true" />}
      triggerClassName="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-rose-600 transition-colors"
    />
  );
}

export function RaiseDisputeButton({
  orderId,
  vendorId,
  vendorName,
  label = "Dispute / Problem with Order",
  variant = "button",
  className,
}: {
  orderId: string;
  vendorId?: string | null;
  vendorName?: string | null;
  label?: string;
  variant?: "button" | "link" | "compact";
  className?: string;
}) {
  return (
    <RaiseTicketModal
      defaultCategory="order_dispute"
      orderId={orderId}
      vendorId={vendorId}
      vendorName={vendorName}
      modalTitle="Raise Order Dispute / Issue"
      triggerVariant={variant}
      triggerText={label}
      triggerClassName={className}
      triggerIcon={<ShieldAlert className="h-4 w-4 text-accent" aria-hidden="true" />}
    />
  );
}
