import { TICKET_STATUS_LABELS, type TicketPriority, type TicketStatus } from "@/core/tickets";

export function TicketStatusBadge({ status }: { status: TicketStatus | string }) {
  const label = TICKET_STATUS_LABELS[status as TicketStatus] ?? status;

  switch (status) {
    case "open":
      return (
        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
          ● {label}
        </span>
      );
    case "in_progress":
      return (
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
          ● {label}
        </span>
      );
    case "resolved":
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
          ✓ {label}
        </span>
      );
    case "closed":
      return (
        <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-600 ring-1 ring-inset ring-neutral-500/20">
          {label}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-600">
          {label}
        </span>
      );
  }
}

export function TicketPriorityBadge({ priority }: { priority: TicketPriority | string }) {
  switch (priority) {
    case "urgent":
      return (
        <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-rose-700 ring-1 ring-inset ring-rose-600/20">
          Urgent
        </span>
      );
    case "high":
      return (
        <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-orange-700 ring-1 ring-inset ring-orange-600/20">
          High
        </span>
      );
    case "medium":
      return (
        <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-amber-700 ring-1 ring-inset ring-amber-600/20">
          Medium
        </span>
      );
    case "low":
    default:
      return (
        <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
          Low
        </span>
      );
  }
}
