import { requireVendorModule } from "@/lib/auth/session";
import Link from "next/link";
import { PageHeader } from "@/components/ui/card";
import { ImportCustomerForm } from "@/features/customers/components/import-customer-form";

export const metadata = { title: "Add households" };

export default async function NewCustomerPage({
  params,
}: {
  params: Promise<{ vendor: string }>;
}) {
  const { vendor: slug } = await params;
  await requireVendorModule(slug, "customers", ["owner", "staff"]);

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <Link href={`/merchant-panel/${slug}/customers`} className="text-sm font-semibold text-muted hover:text-ink">
        ← Customers
      </Link>
      <PageHeader
        title="Add households"
        description="Add single households or paste lines from your paper khata or WhatsApp group."
      />
      <ImportCustomerForm slug={slug} />
    </div>
  );
}
