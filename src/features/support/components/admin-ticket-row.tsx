"use client";

import { useId, useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Clock, Loader2, User } from "lucide-react";
import { TICKET_CATEGORIES, type TicketCategory, type TicketPriority, type TicketStatus } from "@/core/tickets";
import { TicketPriorityBadge, TicketStatusBadge } from "./ticket-status-badge";
import { updateTicketStatus } from "@/features/support/actions";

export interface TicketRowData {
  id: string;
  number: string;
  userId: string;
  userName: string | null;
  userPhone: string | null;
  userEmail: string | null;
  vendorId: string | null;
  vendorName: string | null;
  category: string;
  subject: string;
  description: string;
  orderId: string | null;
  bookingId: string | null;
  subscriptionId: string | null;
  reviewId: string | null;
  status: string;
  priority: string;
  adminNotes: string | null;
  resolution: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  resolvedAt: Date | string | null;
}

const timeFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function AdminTicketRow({
  ticket,
  isMerchant = false,
}: {
  ticket: TicketRowData;
  isMerchant?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<TicketStatus>(ticket.status as TicketStatus);
  const [priority, setPriority] = useState<TicketPriority>(ticket.priority as TicketPriority);
  const [resolution, setResolution] = useState(ticket.resolution ?? "");
  const [adminNotes, setAdminNotes] = useState(ticket.adminNotes ?? "");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const fieldId = useId();

  const handleUpdate = () => {
    setMsg(null);
    startTransition(async () => {
      try {
        const res = await updateTicketStatus({
          ticketId: ticket.id,
          status,
          priority: isMerchant ? undefined : priority,
          resolution: resolution.trim() || undefined,
          adminNotes: isMerchant ? undefined : adminNotes.trim() || undefined,
        });
        setMsg(res.ok ? { type: "success", text: "Ticket updated." } : { type: "error", text: res.error });
      } catch {
        setMsg({ type: "error", text: "Could not save the ticket. Please try again." });
      }
    });
  };

  const catMeta = TICKET_CATEGORIES[ticket.category as TicketCategory] ?? {
    label: ticket.category,
    isDispute: false,
    isReport: false,
  };

  return (
    <li className="rounded-[14px] border border-line bg-surface p-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-accent">{ticket.number}</span>
            <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-muted">
              {catMeta.label}
            </span>
            {catMeta.isDispute && (
              <span className="rounded-md bg-blush px-2 py-0.5 text-[11px] font-semibold text-bad">
                Dispute
              </span>
            )}
            {catMeta.isReport && (
              <span className="rounded-md bg-butter px-2 py-0.5 text-[11px] font-semibold text-warn">
                Reported
              </span>
            )}
          </div>

          <h3 className="mt-1 text-base font-semibold text-ink">{ticket.subject}</h3>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" aria-hidden="true" />
              <strong className="text-ink">{ticket.userName || "Customer"}</strong>
              {ticket.userPhone && ` · ${ticket.userPhone}`}
            </span>
            {ticket.vendorName && (
              <span>
                Store: <strong className="text-ink">{ticket.vendorName}</strong>
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {timeFmt.format(new Date(ticket.createdAt))}
            </span>
          </div>
        </div>

        <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-start gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <TicketStatusBadge status={status} />
            <TicketPriorityBadge priority={priority} />
          </div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls={`${fieldId}-panel`}
            className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-line bg-bg px-2.5 py-1 text-xs font-medium text-ink transition-colors hover:bg-neutral-100"
          >
            {expanded ? (
              <>
                Less <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
              </>
            ) : (
              <>
                Manage <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-ink">{ticket.description}</p>

      {/* Expanded Details & Resolution Editor */}
      {expanded && (
        <div id={`${fieldId}-panel`} className="mt-4 space-y-4 border-t border-line pt-4 text-sm">
          <div className="rounded-xl bg-neutral-50 p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Full Description</p>
            <p className="mt-1.5 whitespace-pre-line leading-relaxed text-ink">{ticket.description}</p>
          </div>

          {/* Reference links */}
          <div className="flex flex-wrap gap-2 text-xs">
            {ticket.userEmail && (
              <span className="rounded bg-neutral-100 px-2 py-1 text-muted">
                Email: <a href={`mailto:${ticket.userEmail}`} className="text-accent underline">{ticket.userEmail}</a>
              </span>
            )}
            {ticket.orderId && (
              <span className="rounded bg-neutral-100 px-2 py-1 font-mono text-muted">
                Order ID: {ticket.orderId}
              </span>
            )}
            {ticket.bookingId && (
              <span className="rounded bg-neutral-100 px-2 py-1 font-mono text-muted">
                Booking ID: {ticket.bookingId}
              </span>
            )}
            {ticket.reviewId && (
              <span className="rounded bg-neutral-100 px-2 py-1 font-mono text-muted">
                Review ID: {ticket.reviewId}
              </span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 pt-2">
            <div>
              <label htmlFor={`${fieldId}-status`} className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
                Status
              </label>
              <select
                id={`${fieldId}-status`}
                value={status}
                disabled={pending}
                onChange={(e) => setStatus(e.target.value as TicketStatus)}
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-accent"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {!isMerchant && (
              <div>
                <label htmlFor={`${fieldId}-priority`} className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
                  Priority
                </label>
                <select
                  id={`${fieldId}-priority`}
                  value={priority}
                  disabled={pending}
                  onChange={(e) => setPriority(e.target.value as TicketPriority)}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-accent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label htmlFor={`${fieldId}-resolution`} className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
              Resolution (the household sees this)
            </label>
            <textarea
              id={`${fieldId}-resolution`}
              rows={2}
              maxLength={1000}
              disabled={pending}
              placeholder="e.g. Redelivered fresh meal container; credited ₹150 for the missed dinner cutoff."
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent"
            />
          </div>

          {!isMerchant && (
            <div>
              <label htmlFor={`${fieldId}-notes`} className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
                Internal notes (admins only)
              </label>
              <textarea
                id={`${fieldId}-notes`}
                rows={2}
                maxLength={1000}
                disabled={pending}
                placeholder="Internal verification notes..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent"
              />
            </div>
          )}

          {msg && (
            <div
              role={msg.type === "error" ? "alert" : "status"}
              className={`rounded-xl p-3 text-xs font-semibold ${msg.type === "success" ? "bg-mint text-good" : "bg-blush text-bad"}`}
            >
              {msg.text}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              disabled={pending}
              onClick={handleUpdate}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-ink px-4 text-xs font-semibold text-white shadow-2xs hover:bg-ink/90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {pending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Saving…
                </>
              ) : (
                "Save changes"
              )}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
