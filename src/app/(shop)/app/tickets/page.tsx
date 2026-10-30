import Link from "next/link";
import { LifeBuoy, MessageSquare, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/features/consumer/components/page-header";
import { getMyTickets } from "@/features/support/queries";
import { TICKET_CATEGORIES, type TicketCategory } from "@/core/tickets";
import { TicketPriorityBadge, TicketStatusBadge } from "@/features/support/components/ticket-status-badge";
import { RaiseTicketModal } from "@/features/support/components/raise-ticket-modal";

export const metadata = { title: "Help & Support / Tickets" };

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default async function TicketsPage() {
  const tickets = await getMyTickets();

  return (
    <div className="min-h-dvh bg-neutral-50 pb-16">
      <PageHeader title="Support & Disputes" subtitle="File a dispute or request assistance" back="/app/account" />

      <div className="px-4 pt-4">
        <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-white p-4 shadow-2xs">
          <div className="min-w-0 pr-3">
            <h2 className="text-base font-bold text-ink">Need help or want to dispute an order?</h2>
            <p className="mt-0.5 text-xs text-neutral-500">
              Our support team reviews issues with cutoffs, food quality, or missing deliveries.
            </p>
          </div>
          <div className="shrink-0">
            <RaiseTicketModal triggerText="New Ticket" />
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="mt-12 flex flex-col items-center px-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-10 w-10" aria-hidden="true" />
            </div>
            <h3 className="mt-5 text-xl font-bold text-ink">No disputes or open tickets</h3>
            <p className="mt-2 max-w-sm text-sm text-neutral-500 leading-relaxed">
              Everything in your account looks good! If you ever have a problem with a meal, delivery, or subscription bill, you can raise a ticket right here.
            </p>
            <div className="mt-6">
              <RaiseTicketModal
                triggerText="Raise Support Ticket"
                triggerClassName="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-6 text-sm font-semibold text-white shadow-xs hover:bg-accent/90 active:scale-[0.98] transition-all"
              />
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Your Tickets ({tickets.length})
            </h3>
            <ul className="space-y-3">
              {tickets.map((t) => {
                const catMeta = TICKET_CATEGORIES[t.category as TicketCategory] ?? {
                  label: t.category,
                  isDispute: false,
                };
                return (
                  <li
                    key={t.id}
                    className="overflow-hidden rounded-2xl border border-black/5 bg-white p-5 shadow-2xs transition-all hover:border-black/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-accent">
                            {t.number}
                          </span>
                          <span className="text-xs font-semibold text-neutral-500">
                            · {catMeta.label}
                          </span>
                        </div>
                        <h4 className="mt-1.5 text-base font-bold text-ink">
                          {t.subject}
                        </h4>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <TicketStatusBadge status={t.status} />
                        <TicketPriorityBadge priority={t.priority} />
                      </div>
                    </div>

                    <p className="mt-2.5 text-sm leading-relaxed text-neutral-700 whitespace-pre-line">
                      {t.description}
                    </p>

                    {(t.vendorName || t.orderId || t.bookingId) && (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-500">
                        {t.vendorName && (
                          <span className="rounded-lg bg-neutral-100 px-2 py-1 font-medium text-neutral-700">
                            Store: {t.vendorName}
                          </span>
                        )}
                        {t.orderId && (
                          <Link
                            href={`/app/orders/${t.orderId}`}
                            className="rounded-lg bg-neutral-100 px-2 py-1 font-mono text-accent hover:underline"
                          >
                            Order #{t.orderId.slice(0, 8)}
                          </Link>
                        )}
                        {t.bookingId && (
                          <Link
                            href={`/app/bookings/${t.bookingId}`}
                            className="rounded-lg bg-neutral-100 px-2 py-1 font-mono text-accent hover:underline"
                          >
                            Booking #{t.bookingId.slice(0, 8)}
                          </Link>
                        )}
                      </div>
                    )}

                    {t.resolution && (
                      <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5 text-xs text-emerald-900">
                        <p className="flex items-center gap-1.5 font-bold text-emerald-800">
                          <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                          Resolution / Team Response:
                        </p>
                        <p className="mt-1 text-emerald-800/90 leading-relaxed">
                          {t.resolution}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3 text-[11px] text-neutral-400">
                      <span>Submitted on {dateFmt.format(t.createdAt)}</span>
                      {t.resolvedAt && (
                        <span>Resolved on {dateFmt.format(t.resolvedAt)}</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-black/5 bg-white p-5 text-center text-xs text-neutral-500">
          <LifeBuoy className="mx-auto h-5 w-5 text-neutral-400 mb-1.5" />
          <p className="font-semibold text-neutral-700">Urgent delivery or hygiene escalation?</p>
          <p className="mt-1">
            You can also write directly to <a href="mailto:adminruxs@gmail.com" className="font-semibold text-accent hover:underline">adminruxs@gmail.com</a> or WhatsApp <a href="https://wa.me/919610201507" target="_blank" rel="noopener noreferrer" className="font-semibold text-good hover:underline">9610201507 (WhatsApp only)</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
