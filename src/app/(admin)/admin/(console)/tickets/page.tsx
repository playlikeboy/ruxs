import Link from "next/link";
import { getAdminTickets } from "@/features/support/queries";
import { AdminTicketRow } from "@/features/support/components/admin-ticket-row";
import { TICKET_CATEGORIES } from "@/core/tickets";

export const metadata = { title: "Tickets & Disputes · Admin" };

const STATUS_FILTERS = [
  { v: "", t: "All Status" },
  { v: "open", t: "Open" },
  { v: "in_progress", t: "In Progress" },
  { v: "resolved", t: "Resolved" },
  { v: "closed", t: "Closed" },
];

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string }>;
}) {
  const { status: rawStatus, category: rawCategory } = await searchParams;
  const status = STATUS_FILTERS.some((f) => f.v === rawStatus) ? rawStatus : "";
  const category = rawCategory && rawCategory in TICKET_CATEGORIES ? rawCategory : "";

  const tickets = await getAdminTickets({
    status: status || undefined,
    category: category || undefined,
  });

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Support Tickets &amp; Disputes</h1>
        <p className="mt-1 text-sm text-muted">
          Manage household disputes, delivery issues, store reports, and platform queries.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 pb-1">
        {STATUS_FILTERS.map((f) => {
          const params = new URLSearchParams();
          if (f.v) params.set("status", f.v);
          if (category) params.set("category", category);
          const href = params.toString() ? `/admin/tickets?${params.toString()}` : "/admin/tickets";
          const isActive = status === f.v;

          return (
            <Link
              key={f.t}
              href={href}
              className={
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors " +
                (isActive
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-surface text-muted hover:border-black/20")
              }
            >
              {f.t}
            </Link>
          );
        })}
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-[14px] border border-line bg-surface p-12 text-center text-sm text-muted">
          No support tickets match the current filters.
        </div>
      ) : (
        <ul className="space-y-3">
          {tickets.map((t) => (
            <AdminTicketRow
              key={t.id}
              ticket={{
                ...t,
                createdAt: t.createdAt.toISOString(),
                updatedAt: t.updatedAt.toISOString(),
                resolvedAt: t.resolvedAt ? t.resolvedAt.toISOString() : null,
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
