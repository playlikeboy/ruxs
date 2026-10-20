import Link from "next/link";
import { formatINR } from "@/core/money";
import { getAdminInvoices, getAdminInvoicePeriods } from "@/features/invoices/queries";
import { AdminInvoicesTable } from "@/features/invoices/components/admin-invoices-table";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { FileText, CheckCircle2, AlertCircle, ArrowUpRight } from "lucide-react";

export const metadata = { title: "Invoices & Billing · Admin" };

const STATUS_FILTERS = [
  { v: "", label: "All Status" },
  { v: "generated", label: "Generated" },
  { v: "sent", label: "Sent" },
  { v: "paid", label: "Paid" },
  { v: "partially_paid", label: "Partial" },
];

export default async function AdminInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string;
    status?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const { period, status, q, page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);

  const [invoicesData, periods] = await Promise.all([
    getAdminInvoices({
      period: period || undefined,
      status: status || undefined,
      q: q || undefined,
      page: currentPage,
      limit: 25,
    }),
    getAdminInvoicePeriods(),
  ]);

  const collectionRate =
    invoicesData.stats.chargesPaise > 0
      ? Math.round((invoicesData.stats.paymentsPaise / invoicesData.stats.chargesPaise) * 100)
      : 0;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Invoices &amp; Billing</h1>
          <p className="mt-1 text-sm text-muted">
            Monthly statements, itemized ledgers, and household settlements across all merchants.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-[16px] border border-line bg-surface p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs uppercase tracking-wider font-semibold">Total Invoiced</span>
            <FileText className="h-4 w-4" aria-hidden="true" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-ink">
            {formatINR(invoicesData.stats.chargesPaise)}
          </p>
          <p className="mt-0.5 text-xs text-muted">{invoicesData.total} total statements</p>
        </div>

        <div className="rounded-[16px] border border-line bg-surface p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs uppercase tracking-wider font-semibold text-good">Collected</span>
            <CheckCircle2 className="h-4 w-4 text-good" aria-hidden="true" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-good">
            {formatINR(invoicesData.stats.paymentsPaise)}
          </p>
          <p className="mt-0.5 text-xs text-muted">{collectionRate}% collection rate</p>
        </div>

        <div className="rounded-[16px] border border-line bg-surface p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs uppercase tracking-wider font-semibold text-bad">Outstanding</span>
            <AlertCircle className="h-4 w-4 text-bad" aria-hidden="true" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-bad">
            {formatINR(invoicesData.stats.closingPaise)}
          </p>
          <p className="mt-0.5 text-xs text-muted">Due from households</p>
        </div>

        <div className="rounded-[16px] border border-line bg-surface p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs uppercase tracking-wider font-semibold">Billing Runs</span>
            <ArrowUpRight className="h-4 w-4 text-accent" aria-hidden="true" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-ink">
            {periods.length}
          </p>
          <p className="mt-0.5 text-xs text-muted">Active monthly cycles</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form className="relative flex-1 min-w-[240px] max-w-sm" role="search">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search invoice #, customer, store…"
            className="h-10 w-full rounded-[10px] border border-line bg-surface px-3 text-xs placeholder:text-muted focus:border-ink focus:outline-none"
          />
          {period && <input type="hidden" name="period" value={period} />}
          {status && <input type="hidden" name="status" value={status} />}
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none]">
            <Link
              href={`/admin/invoices${status ? `?status=${status}` : ""}`}
              className={
                "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition " +
                (!period
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-surface text-muted hover:border-ink/40")
              }
            >
              All Months
            </Link>
            {periods.map((p) => {
              const active = period === p;
              const params = new URLSearchParams();
              params.set("period", p);
              if (status) params.set("status", status);
              return (
                <Link
                  key={p}
                  href={`/admin/invoices?${params.toString()}`}
                  className={
                    "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold font-mono transition " +
                    (active
                      ? "border-ink bg-ink text-white"
                      : "border-line bg-surface text-muted hover:border-ink/40")
                  }
                >
                  {p}
                </Link>
              );
            })}
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none]">
            {STATUS_FILTERS.map((f) => {
              const active = (status ?? "") === f.v;
              const params = new URLSearchParams();
              if (f.v) params.set("status", f.v);
              if (period) params.set("period", period);
              return (
                <Link
                  key={f.label}
                  href={`/admin/invoices?${params.toString()}`}
                  className={
                    "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition " +
                    (active
                      ? "border-accent bg-accent text-white"
                      : "border-line bg-surface text-muted hover:border-ink/40")
                  }
                >
                  {f.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Invoices List / Table */}
      {invoicesData.rows.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-line bg-surface p-12 text-center">
          <p className="font-semibold text-ink">No invoices found</p>
          <p className="mt-1 text-xs text-muted">
            Try adjusting your search query, period, or status filters.
          </p>
        </div>
      ) : (
        <AdminInvoicesTable rows={invoicesData.rows} />
      )}

      {/* Pagination */}
      <AdminPagination
        page={invoicesData.page}
        totalPages={invoicesData.totalPages}
        totalItems={invoicesData.total}
        limit={invoicesData.limit}
      />
    </div>
  );
}
