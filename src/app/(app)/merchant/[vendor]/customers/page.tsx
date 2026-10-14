import Link from "next/link";
import { getCustomersForVendor } from "@/features/customers/queries";
import { CustomerListView } from "@/features/customers/components/customer-list-view";
import { EmptyState } from "@/components/ui/empty-state";

export default async function CustomersPage({
  params,
}: {
  params: Promise<{ vendor: string }>;
}) {
  const { vendor: slug } = await params;
  const custList = await getCustomersForVendor(slug);

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Customers
          </h1>
          <p className="text-xs text-muted">
            Households, khata balances, and delivery addresses
          </p>
        </div>

        <Link
          href={`/merchant/${slug}/customers/new`}
          className="px-3 py-2 bg-accent text-white text-xs font-semibold rounded-[10px] hover:opacity-90 active:scale-95 transition-all shadow-xs"
        >
          + Add / Import
        </Link>
      </div>

      {custList.length === 0 ? (
        <EmptyState
          title="No customers yet"
          description="Add your first household or paste a list from WhatsApp or paper khata."
          action={
            <Link
              href={`/merchant/${slug}/customers/new`}
              className="inline-block px-4 py-2 bg-accent text-white text-sm font-medium rounded-[10px]"
            >
              Add / Import Customers
            </Link>
          }
        />
      ) : (
        <CustomerListView customers={custList} slug={slug} />
      )}
    </div>
  );
}
