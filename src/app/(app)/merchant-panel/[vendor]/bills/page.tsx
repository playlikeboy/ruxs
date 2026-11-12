import { requireVendorModule } from "@/lib/auth/session";
import { todayIST } from "@/core/time";
import { getVendorBills } from "@/features/billing/queries";
import { GenerateBillsButton } from "@/features/billing/components/generate-bills-button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/card";
import { InvoiceCard } from "./_components/invoice-card";

export const metadata = { title: "Bills" };

export default async function BillsPage({
  params,
}: {
  params: Promise<{ vendor: string }>;
}) {
  const { vendor: slug } = await params;
  await requireVendorModule(slug, "bills", ["owner", "staff"]);
  const currentPeriod = todayIST().substring(0, 7);

  const bills = await getVendorBills(slug);

  return (
    <div className="max-w-3xl space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Bills & khata"
        description="Monthly itemised bills, worked out from each household's khata."
        action={<GenerateBillsButton slug={slug} defaultPeriod={currentPeriod} />}
      />

      {bills.length === 0 ? (
        <EmptyState
          title="No bills generated yet"
          description="Bills are generated automatically on the 1st at 10:00 IST, or you can generate them now."
          icon="bill"
          action={<GenerateBillsButton slug={slug} defaultPeriod={currentPeriod} />}
        />
      ) : (
        <ul className="space-y-3">
          {bills.map((bill) => (
            <InvoiceCard key={bill.invoice.id} slug={slug} bill={bill} showPeriod />
          ))}
        </ul>
      )}
    </div>
  );
}
