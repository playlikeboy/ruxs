import { requireVendorModule } from "@/lib/auth/session";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getVendorBills } from "@/features/billing/queries";
import { GenerateBillsButton } from "@/features/billing/components/generate-bills-button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/card";
import { InvoiceCard } from "../_components/invoice-card";

export const metadata = { title: "Bills for the month" };

// Bill periods are calendar months, e.g. 2026-10.
const PERIOD = /^\d{4}-(0[1-9]|1[0-2])$/;

export default async function VendorMonthlyBillsPage({
  params,
}: {
  params: Promise<{ vendor: string; month: string }>;
}) {
  const { vendor: slug, month } = await params;
  await requireVendorModule(slug, "bills", ["owner", "staff"]);
  if (!PERIOD.test(month)) notFound();
  const bills = await getVendorBills(slug, month);

  return (
    <div className="max-w-3xl space-y-4 p-4 sm:p-6">
      <Link href={`/merchant-panel/${slug}/bills`} className="text-sm font-semibold text-muted hover:text-ink">
        ← All bills
      </Link>

      <PageHeader
        title={`Bills for ${month}`}
        description="Itemised statements, worked out from each household's khata."
        action={<GenerateBillsButton slug={slug} defaultPeriod={month} />}
      />

      {bills.length === 0 ? (
        <EmptyState
          title={`No bills generated for ${month}`}
          description="You can generate bills for every active customer khata now."
          icon="bill"
          action={<GenerateBillsButton slug={slug} defaultPeriod={month} />}
        />
      ) : (
        <ul className="space-y-3">
          {bills.map((bill) => (
            <InvoiceCard key={bill.invoice.id} slug={slug} bill={bill} />
          ))}
        </ul>
      )}
    </div>
  );
}
