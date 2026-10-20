export function InvoiceStatusPill({ status }: { status: string }) {
  const styles: Record<string, { label: string; tone: string }> = {
    draft: { label: "Draft", tone: "bg-muted/10 text-muted border-line" },
    generated: { label: "Generated", tone: "bg-warn/10 text-warn border-warn/20" },
    sent: { label: "Sent", tone: "bg-accent/10 text-accent border-accent/20" },
    paid: { label: "Paid", tone: "bg-good/10 text-good border-good/20" },
    partially_paid: { label: "Partially Paid", tone: "bg-butter text-warn border-warn/30" },
  };

  const current = styles[status] ?? { label: status, tone: "bg-bg text-muted border-line" };

  return (
    <span
      className={
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize " +
        current.tone
      }
    >
      {current.label}
    </span>
  );
}
