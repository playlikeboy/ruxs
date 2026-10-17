"use client";

import { useState, useTransition } from "react";
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

  const handleUpdate = () => {
    setMsg(null);
    startTransition(async () => {
      const res = await updateTicketStatus({
        ticketId: ticket.id,
        status,
        priority: isMerchant ? undefined : priority,
        resolution: resolution.trim() || undefined,
        adminNotes: adminNotes.trim() || undefined,
      });

      if (!res.ok) {
        setMsg({ type: "error", text: res.error });
      } else {
        setMsg({ type: "success", text: "Ticket updated successfully." });
      }
    });
  };

  const catMeta = TICKET_CATEGORIES[ticket.category as TicketCategory] ?? {
    label: ticket.category,
    isDispute: false,
    isReport: false,
  };

  return (
    <li className="rounded-[14px] border border-line bg-surface p-4 shadow-2xs transition-colors hover:border-black/20">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-accent">{ticket.number}</span>
            <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">
              {catMeta.label}
            </span>
            {catMeta.isDispute && (
              <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                Dispute
              </span>
            )}
            {catMeta.isReport && (
              <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                Reported
              </span>
            )}
          </div>

          <h3 className="mt-1 text-base font-semibold text-ink">{ticket.subject}</h3>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              <strong className="text-ink">{ticket.userName || "Customer"}</strong>
              {ticket.userPhone && ` · ${ticket.userPhone}`}
            </span>
            {ticket.vendorName && (
              <span>
                Store: <strong className="text-ink">{ticket.vendorName}</strong>
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
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
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1 rounded-lg border border-line bg-bg px-2.5 py-1 text-xs font-medium text-ink hover:bg-neutral-100 transition-colors"
          >
            {expanded ? (
              <>
                Less <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                Manage <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      <p className="mt-3 text-sm text-neutral-700 line-clamp-2">{ticket.description}</p>

      {/* Expanded Details & Resolution Editor */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-line space-y-4 text-sm animate-in fade-in duration-150">
          <div className="rounded-xl bg-neutral-50 p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Full Description</p>
            <p className="mt-1.5 text-neutral-800 whitespace-pre-line leading-relaxed">{ticket.description}</p>
          </div>

          {/* Reference links */}
          <div className="flex flex-wrap gap-2 text-xs">
            {ticket.userEmail && (
              <span className="rounded bg-neutral-100 px-2 py-1 text-neutral-600">
                Email: <a href={`mailto:${ticket.userEmail}`} className="text-accent underline">{ticket.userEmail}</a>
              </span>
            )}
            {ticket.orderId && (
              <span className="rounded bg-neutral-100 px-2 py-1 font-mono text-neutral-600">
                Order ID: {ticket.orderId}
              </span>
            )}
            {ticket.bookingId && (
              <span className="rounded bg-neutral-100 px-2 py-1 font-mono text-neutral-600">
                Booking ID: {ticket.bookingId}
              </span>
            )}
            {ticket.reviewId && (
              <span className="rounded bg-neutral-100 px-2 py-1 font-mono text-neutral-600">
                Review ID: {ticket.reviewId}
              </span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                Status
              </label>
              <select
                value={status}
                disabled={pending}
                onChange={(e) => setStatus(e.target.value as TicketStatus)}
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-hidden"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {!isMerchant && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  disabled={pending}
                  onChange={(e) => setPriority(e.target.value as TicketPriority)}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-hidden"
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              Customer Resolution (Visible to Household)
            </label>
            <textarea
              rows={2}
              maxLength={1000}
              disabled={pending}
              placeholder="e.g. Redelivered fresh meal container; credited ₹150 for the missed dinner cutoff."
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="w-full rounded-xl border border-line px-3 py-2 text-sm text-ink placeholder:text-neutral-400 focus:border-accent focus:outline-hidden"
            />
          </div>

          {!isMerchant && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                Admin Private Notes (Internal Only)
              </label>
              <textarea
                rows={2}
                maxLength={1000}
                disabled={pending}
                placeholder="Internal verification notes..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full rounded-xl border border-line px-3 py-2 text-sm text-ink placeholder:text-neutral-400 focus:border-accent focus:outline-hidden"
              />
            </div>
          )}

          {msg && (
            <div
              className={`rounded-xl p-3 text-xs font-semibold ${
                msg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
              }`}
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
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
