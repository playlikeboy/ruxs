const LABEL: Record<string, { text: string; tone: string }> = {
  held: { text: "Awaiting payment", tone: "bg-butter text-warn" },
  confirmed: { text: "Confirmed", tone: "bg-sky text-ink" },
  done: { text: "Completed", tone: "bg-mint text-good" },
  no_show: { text: "Missed", tone: "bg-blush text-bad" },
  cancelled: { text: "Cancelled", tone: "bg-neutral-100 text-muted" },
};

export function BookingStatus({ status }: { status: string }) {
  const s = LABEL[status] ?? { text: status, tone: "bg-neutral-100 text-muted" };
  return <span className={"inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold " + s.tone}>{s.text}</span>;
}

export const PAYMENT_LABEL: Record<string, string> = {
  unpaid: "Not paid",
  paid: "Paid",
  refund_due: "Refund on its way",
  refunded: "Refunded",
};
