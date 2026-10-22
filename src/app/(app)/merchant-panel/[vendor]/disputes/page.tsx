import { requireVendorAccess, requireVendorModule } from "@/lib/auth/session";
import { getVendorTickets } from "@/features/support/queries";
import { AdminTicketRow } from "@/features/support/components/admin-ticket-row";
import { ShieldCheck } from "lucide-react";

export const metadata = { title: "Customer Disputes & Issues · Merchant Panel" };

export default async function VendorDisputesPage({
  params,
}: {
  params: Promise<{ vendor: string }>;
}) {
  const { vendor: slug } = await params;
  await requireVendorModule(slug, "disputes");
  const access = await requireVendorAccess(slug);
  const tickets = await getVendorTickets(slug);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">Customer Support</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Disputes &amp; Issues</h1>
        <p className="mt-1 text-sm text-muted">
          Manage disputes, missing delivery complaints, and customer reports for {access.vendor.name}.
        </p>
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-[14px] border border-line bg-surface p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-ink">No customer disputes</h2>
          <p className="mt-1 text-sm text-muted max-w-sm mx-auto">
            Households haven&apos;t filed any disputes or complaints against {access.vendor.name}. Keep delivering quality!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            Reported Issues ({tickets.length})
          </p>
          <ul className="space-y-3">
            {tickets.map((t) => (
              <AdminTicketRow
                key={t.id}
                isMerchant={true}
                ticket={{
                  ...t,
                  createdAt: t.createdAt.toISOString(),
                  updatedAt: t.updatedAt.toISOString(),
                  resolvedAt: t.resolvedAt ? t.resolvedAt.toISOString() : null,
                }}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
