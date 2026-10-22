import { requireVendorModule } from "@/lib/auth/session";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatINR } from "@/core/money";
import { getCustomerDetails } from "@/features/customers/queries";
import { AddAdjustmentDialog } from "@/features/customers/components/add-adjustment-dialog";
import { ResetLinkButton } from "@/features/customers/components/reset-link-button";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ vendor: string; id: string }>;
}) {
  const { vendor: slug, id } = await params;
  await requireVendorModule(slug, "customers");
  const data = await getCustomerDetails(slug, id);

  if (!data) {
    notFound();
  }

  const { customer, subscriptions, ledger, balancePaise, canHoldings } = data;

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Back Link */}
      <div>
        <Link
          href={`/merchant-panel/${slug}/customers`}
          className="text-xs text-muted hover:text-ink font-medium"
        >
          ← Back to Customers
        </Link>
      </div>

      {/* Household Profile Card */}
      <div className="bg-surface border border-line rounded-[12px] p-4 space-y-3 shadow-xs">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-ink">
              {customer.name}
            </h1>
            <div className="text-sm font-medium text-ink mt-0.5">
              Flat {customer.flat}
              {customer.tower ? `, Tower ${customer.tower}` : ""}
              {customer.floor ? ` (Fl ${customer.floor})` : ""}
            </div>
            <div className="text-xs text-muted mt-0.5">{customer.society}</div>
          </div>

          <a
            href={`tel:${customer.phone}`}
            className="px-3 py-1.5 bg-[#FAFAF7] border border-line rounded-[8px] text-xs font-semibold text-ink hover:bg-white active:scale-95 transition-all"
          >
            📞 {customer.phone}
          </a>
        </div>

        {/* Balance & Cans Metrics */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line">
          <div className="p-3 bg-[#FAFAF7] rounded-[10px]">
            <span className="text-[11px] text-muted block">Khata Balance</span>
            <span
              className={`text-lg font-bold font-mono tabular-nums ${
                balancePaise > 0
                  ? "text-[#B42318]"
                  : balancePaise < 0
                    ? "text-good"
                    : "text-ink"
              }`}
            >
              {formatINR(balancePaise)}
            </span>
          </div>

          <div className="p-3 bg-[#FAFAF7] rounded-[10px]">
            <span className="text-[11px] text-muted block">Cans / Assets Held</span>
            <span className="text-lg font-bold font-mono tabular-nums text-ink">
              {canHoldings}
            </span>
          </div>
        </div>
      </div>

      {/* Subscriptions */}
      <div className="bg-surface border border-line rounded-[12px] p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Active Subscriptions</h2>
          <span className="text-xs text-muted tabular-nums">
            {subscriptions.length} active
          </span>
        </div>

        {subscriptions.length === 0 ? (
          <div className="text-xs text-muted py-2">
            No active subscriptions assigned to this household yet.
          </div>
        ) : (
          <div className="divide-y divide-line/60">
            {subscriptions.map(({ sub, product }) => (
              <div
                key={sub.id}
                className="py-2.5 flex items-center justify-between text-xs first:pt-0 last:pb-0"
              >
                <div>
                  <div className="font-medium text-ink">{product.name}</div>
                  <div className="text-muted text-[11px]">
                    Qty: {sub.qty} • Days: {sub.days.join(", ")}
                  </div>
                </div>
                <div className="font-mono text-ink font-semibold">
                  {formatINR(product.pricePaise)} / meal
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Khata Ledger Timeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink">Khata History</h2>
            <p className="text-xs text-muted">
              Append-only ledger. Changes are recorded with immutable entries.
            </p>
          </div>

          <AddAdjustmentDialog
            slug={slug}
            customerId={customer.id}
            customerName={customer.name}
          />
        </div>

        {ledger.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted bg-surface border border-line rounded-[12px]">
            No khata transactions recorded yet.
          </div>
        ) : (
          <div className="bg-surface border border-line rounded-[12px] divide-y divide-line overflow-hidden shadow-xs">
            {ledger.map((entry) => {
              const isDebit = entry.amountPaise > 0; // Household owes more
              return (
                <div
                  key={entry.id}
                  className="p-3.5 flex items-start justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                          entry.type === "payment"
                            ? "bg-[#E1F3E7] text-good"
                            : entry.type === "late_fee"
                              ? "bg-[#FFF3C9] text-[#9A5B00]"
                              : entry.type === "delivery"
                                ? "bg-[#FAFAF7] text-ink border border-line"
                                : "bg-surface text-muted border border-line"
                        }`}
                      >
                        {entry.type.replace("_", " ")}
                      </span>
                      <span className="text-muted text-[11px]">
                        {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Asia/Kolkata",
                        })}
                      </span>
                    </div>

                    {entry.notes && (
                      <div className="text-ink text-xs pt-0.5">
                        {entry.notes}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-mono font-bold tabular-nums ${
                        isDebit ? "text-ink" : "text-good"
                      }`}
                    >
                      {isDebit ? `+${formatINR(entry.amountPaise)}` : `-${formatINR(Math.abs(entry.amountPaise))}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Household Link Management */}
      <div className="p-4 bg-surface border border-line rounded-[12px] space-y-2 text-xs">
        <h3 className="font-semibold text-ink">Private Link Management</h3>
        <p className="text-muted leading-relaxed">
          The household accesses their calendar, bills, and pause controls using their secure private link.
        </p>
        <div className="pt-1">
          <ResetLinkButton slug={slug} customerId={customer.id} />
        </div>
      </div>
    </div>
  );
}
