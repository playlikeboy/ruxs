"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, LifeBuoy, Loader2, ShieldAlert, X } from "lucide-react";
import { TICKET_CATEGORIES, type TicketCategory } from "@/core/tickets";
import { raiseTicket } from "@/features/support/actions";

interface RaiseTicketModalProps {
  defaultCategory?: TicketCategory;
  lockCategory?: boolean;
  vendorId?: string | null;
  vendorName?: string | null;
  orderId?: string | null;
  bookingId?: string | null;
  subscriptionId?: string | null;
  reviewId?: string | null;
  modalTitle?: string;
  triggerText?: string;
  triggerClassName?: string;
  triggerIcon?: React.ReactNode;
  triggerVariant?: "button" | "link" | "compact";
  onSuccess?: (ticketNumber: string) => void;
}

export function RaiseTicketModal({
  defaultCategory = "general_query",
  lockCategory = false,
  vendorId,
  vendorName,
  orderId,
  bookingId,
  subscriptionId,
  reviewId,
  modalTitle,
  triggerText = "Raise Ticket / Dispute",
  triggerClassName,
  triggerIcon,
  triggerVariant = "button",
  onSuccess,
}: RaiseTicketModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<TicketCategory>(defaultCategory);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleOpen = () => {
    setCategory(defaultCategory);
    setSubject("");
    setDescription("");
    setError(null);
    setTicketNumber(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    if (ticketNumber) {
      router.refresh();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (subject.trim().length < 3) {
      setError("Please enter a subject (at least 3 characters).");
      return;
    }
    if (description.trim().length < 10) {
      setError("Please provide at least 10 characters explaining your issue.");
      return;
    }

    startTransition(async () => {
      const res = await raiseTicket({
        category,
        subject: subject.trim(),
        description: description.trim(),
        vendorId: vendorId || null,
        vendorName: vendorName || null,
        orderId: orderId || null,
        bookingId: bookingId || null,
        subscriptionId: subscriptionId || null,
        reviewId: reviewId || null,
      });

      if (!res.ok) {
        setError(res.error);
        return;
      }

      setTicketNumber(res.ticketNumber);
      if (onSuccess) {
        onSuccess(res.ticketNumber);
      }
    });
  };

  const activeMeta = TICKET_CATEGORIES[category] ?? TICKET_CATEGORIES.general_query;
  const computedTitle = modalTitle ?? (activeMeta.isReport ? "Report Issue" : activeMeta.isDispute ? "Raise Dispute" : "Raise Support Ticket");

  return (
    <>
      {triggerVariant === "compact" ? (
        <button
          type="button"
          onClick={handleOpen}
          className={
            triggerClassName ??
            "inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-accent transition-colors"
          }
        >
          {triggerIcon ?? <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />}
          {triggerText}
        </button>
      ) : triggerVariant === "link" ? (
        <button
          type="button"
          onClick={handleOpen}
          className={
            triggerClassName ??
            "text-sm font-semibold text-accent hover:underline transition-colors inline-flex items-center gap-1.5"
          }
        >
          {triggerIcon ?? <LifeBuoy className="h-4 w-4" aria-hidden="true" />}
          {triggerText}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          className={
            triggerClassName ??
            "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 text-sm font-semibold text-ink shadow-2xs hover:bg-neutral-50 active:scale-[0.99] transition-all"
          }
        >
          {triggerIcon ?? <LifeBuoy className="h-4 w-4 text-accent" aria-hidden="true" />}
          {triggerText}
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-black/10 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-4 top-4 rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-ink transition-colors"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>

            {ticketNumber ? (
              <div className="py-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-9 w-9" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-ink">Ticket Submitted</h3>
                <p className="mt-1 text-sm font-medium text-emerald-600">
                  Reference: <span className="font-mono font-bold">{ticketNumber}</span>
                </p>
                <p className="mt-3 text-sm text-neutral-600 leading-relaxed max-w-sm mx-auto">
                  Our operations team has received your ticket and is reviewing it. We have sent a confirmation email with this reference number.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      router.push("/app/tickets");
                    }}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-ink px-5 text-sm font-semibold text-white hover:bg-ink/90 active:scale-[0.98] transition-all"
                  >
                    View All Tickets
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-black/10 bg-white px-5 text-sm font-semibold text-ink hover:bg-neutral-50 active:scale-[0.98] transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-ink">{computedTitle}</h2>
                  <p className="mt-1 text-xs text-neutral-500">
                    Disputes, delivery issues, hygiene reports, or general assistance.
                  </p>
                </div>

                {/* Context Badges if attached */}
                {(vendorName || orderId || bookingId || subscriptionId || reviewId) && (
                  <div className="flex flex-wrap gap-1.5 rounded-xl bg-neutral-50 p-2.5 text-xs text-neutral-600 border border-neutral-100">
                    {vendorName && (
                      <span className="font-semibold text-ink">Store: {vendorName}</span>
                    )}
                    {orderId && (
                      <span className="rounded bg-white px-1.5 py-0.5 border border-black/5 font-mono">
                        Order #{orderId.slice(0, 8)}
                      </span>
                    )}
                    {bookingId && (
                      <span className="rounded bg-white px-1.5 py-0.5 border border-black/5 font-mono">
                        Booking #{bookingId.slice(0, 8)}
                      </span>
                    )}
                    {subscriptionId && (
                      <span className="rounded bg-white px-1.5 py-0.5 border border-black/5">
                        Subscription Plan
                      </span>
                    )}
                    {reviewId && (
                      <span className="rounded bg-white px-1.5 py-0.5 border border-black/5 font-mono">
                        Review Flagged
                      </span>
                    )}
                  </div>
                )}

                {/* Category selector */}
                <div>
                  <label htmlFor="ticket-category" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                    Issue Category
                  </label>
                  <select
                    id="ticket-category"
                    value={category}
                    disabled={lockCategory || pending}
                    onChange={(e) => setCategory(e.target.value as TicketCategory)}
                    className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm font-medium text-ink focus:border-accent focus:outline-hidden focus:ring-2 focus:ring-accent/20 disabled:bg-neutral-100"
                  >
                    {Object.entries(TICKET_CATEGORIES).map(([key, meta]) => (
                      <option key={key} value={key}>
                        {meta.label} {meta.isDispute ? "(Dispute)" : meta.isReport ? "(Report)" : ""}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-neutral-500">
                    {activeMeta.description}
                  </p>
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="ticket-subject" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                    Subject / Title
                  </label>
                  <input
                    id="ticket-subject"
                    type="text"
                    required
                    maxLength={120}
                    disabled={pending}
                    placeholder="e.g. Missing meal container, delayed driver, or quality concern"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-xl border border-black/10 px-3.5 py-2.5 text-sm text-ink placeholder:text-neutral-400 focus:border-accent focus:outline-hidden focus:ring-2 focus:ring-accent/20 disabled:bg-neutral-100"
                  />
                </div>

                {/* Description */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="ticket-desc" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600">
                      Details
                    </label>
                    <span className="text-[11px] text-neutral-400 tabular-nums">
                      {description.length} / 2000
                    </span>
                  </div>
                  <textarea
                    id="ticket-desc"
                    required
                    rows={4}
                    maxLength={2000}
                    disabled={pending}
                    placeholder="Describe what happened with as much specific detail as possible..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl border border-black/10 px-3.5 py-2.5 text-sm text-ink placeholder:text-neutral-400 focus:border-accent focus:outline-hidden focus:ring-2 focus:ring-accent/20 disabled:bg-neutral-100"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={handleClose}
                    className="h-10 rounded-xl px-4 text-sm font-semibold text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-white shadow-xs hover:bg-accent/90 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {pending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      "Submit Request"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
