import { UiIcon } from "@/components/ui/app-icon";
import { cn } from "@/components/ui/cn";
import { TICKET_STATUS_LABELS, type TicketPriority, type TicketStatus } from "@/core/tickets";

const STATUS_TONE: Record<string, { chip: string; dot: string | null }> = {
  open: { chip: "bg-butter text-warn ring-warn/20", dot: "bg-warn" },
  in_progress: { chip: "bg-sky text-ink ring-ink/10", dot: "bg-ink" },
  resolved: { chip: "bg-mint text-good ring-good/20", dot: null },
  closed: { chip: "bg-neutral-100 text-muted ring-line", dot: null },
};

export function TicketStatusBadge({ status }: { status: TicketStatus | string }) {
  const label = TICKET_STATUS_LABELS[status as TicketStatus] ?? status;
  const tone = STATUS_TONE[status] ?? { chip: "bg-neutral-100 text-muted ring-line", dot: null };

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", tone.chip)}>
      {status === "resolved" ? <UiIcon name="check" /> : tone.dot ? <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} aria-hidden="true" /> : null}
      {label}
    </span>
  );
}

const PRIORITY: Record<string, { label: string; chip: string }> = {
  urgent: { label: "Urgent", chip: "bg-blush font-bold text-bad ring-bad/20" },
  high: { label: "High", chip: "bg-peach font-bold text-accent ring-accent/20" },
  medium: { label: "Medium", chip: "bg-butter font-semibold text-warn ring-warn/20" },
  low: { label: "Low", chip: "bg-neutral-100 font-semibold text-muted ring-line" },
};

export function TicketPriorityBadge({ priority }: { priority: TicketPriority | string }) {
  const p = PRIORITY[priority] ?? PRIORITY.low!;
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] uppercase tracking-wider ring-1 ring-inset", p.chip)}>
      {p.label}
    </span>
  );
}
