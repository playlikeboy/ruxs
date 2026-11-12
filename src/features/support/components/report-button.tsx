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
      modalTitle="Report this review"
      triggerVariant="compact"
      triggerText="Report"
      triggerIcon={<Flag className="h-3 w-3" aria-hidden="true" />}
      triggerClassName="inline-flex min-h-8 items-center gap-1 text-[11px] font-medium text-muted transition-colors hover:text-bad"
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
      modalTitle={`Report ${vendorName}`}
      triggerVariant="compact"
      triggerText="Report store"
      triggerIcon={<Flag className="h-3.5 w-3.5" aria-hidden="true" />}
      triggerClassName="inline-flex min-h-10 items-center gap-1.5 text-xs text-muted transition-colors hover:text-bad"
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
      modalTitle="Report a problem with this order"
      triggerVariant={variant}
      triggerText={label}
      triggerClassName={className}
      triggerIcon={<ShieldAlert className="h-4 w-4 text-accent" aria-hidden="true" />}
    />
  );
}
