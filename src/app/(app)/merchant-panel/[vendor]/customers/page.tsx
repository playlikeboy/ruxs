import { requireVendorModule } from "@/lib/auth/session";
import { Plus } from "lucide-react";
import { getCustomersForVendor } from "@/features/customers/queries";
import { CustomerListView } from "@/features/customers/components/customer-list-view";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export const metadata = { title: "Customers" };

export default async function CustomersPage({
  params,
}: {
  params: Promise<{ vendor: string }>;
}) {
  const { vendor: slug } = await params;
  // Same roles as the nav: balances and addresses are desk work, not for drivers.
  await requireVendorModule(slug, "customers", ["owner", "staff"]);
  const custList = await getCustomersForVendor(slug);
  const newHref = `/merchant-panel/${slug}/customers/new`;

  return (
    <div className="max-w-3xl space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Customers"
        description="Households, khata balances and delivery addresses."
        action={
          <ButtonLink href={newHref} size="sm">
            <Plus className="h-4 w-4" aria-hidden="true" /> Add or import
          </ButtonLink>
        }
      />

      {custList.length === 0 ? (
        <EmptyState
          title="No customers yet"
          description="Add your first household or paste a list from WhatsApp or paper khata."
          action={<ButtonLink href={newHref}>Add or import customers</ButtonLink>}
        />
      ) : (
        <CustomerListView customers={custList} slug={slug} />
      )}
    </div>
  );
}
