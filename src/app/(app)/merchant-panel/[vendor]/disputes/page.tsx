import { requireVendorModule } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/card";
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
  // Same roles as the nav: complaints are desk work, not for drivers.
  const access = await requireVendorModule(slug, "disputes", ["owner", "staff"]);
  const tickets = await getVendorTickets(slug);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Disputes & issues"
        description={`Disputes, missed-delivery complaints and other reports about ${access.vendor.name}.`}
      />

      {tickets.length === 0 ? (
        <div className="rounded-card border border-line bg-surface p-8 text-center sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-mint text-good" aria-hidden="true">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-ink">No customer disputes</h2>
          <p className="mt-1 text-sm text-muted max-w-sm mx-auto">
            Households haven&apos;t raised any disputes or complaints about {access.vendor.name}.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted">
            Reported issues ({tickets.length})
          </h2>
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
