import Link from "next/link";
import { ImportCustomerForm } from "@/features/customers/components/import-customer-form";

export default async function NewCustomerPage({
  params,
}: {
  params: Promise<{ vendor: string }>;
}) {
  const { vendor: slug } = await params;

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href={`/merchant/${slug}/customers`}
          className="text-xs text-muted hover:text-ink font-medium"
        >
          ← Customers
        </Link>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Add Households
        </h1>
        <p className="text-xs text-muted">
          Add single households or paste lines from your paper khata or WhatsApp group.
        </p>
      </div>

      <ImportCustomerForm slug={slug} />
    </div>
  );
}
