import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/card";
import { requireVendorModule } from "@/lib/auth/session";
import { VENDOR_TYPE_INFO } from "@/core/vendor-types";
import { getMenuForVendor, getMenuItem } from "@/features/products/queries";
import { getMyItemDetails } from "@/features/vendor-types/queries";
import { ITEM_FIELDS } from "@/features/vendor-types/fields";
import { TypeFieldsForm } from "@/features/vendor-types/components/type-fields-form";
import { ProductForm } from "@/features/products/components/product-form";

export const metadata = { title: "Edit item" };

export default async function EditProductPage({ params }: { params: Promise<{ vendor: string; id: string }> }) {
  const { vendor: slug, id } = await params;
  const access = await requireVendorModule(slug, "products", ["owner"]);
  const [item, { rows }] = await Promise.all([getMenuItem(slug, id), getMenuForVendor(slug)]);
  if (!item) notFound();
  const type = access.vendorType;
  const itemFields = ITEM_FIELDS[type];
  const { details } = itemFields ? await getMyItemDetails(slug, [item.id]) : { details: new Map() };
  const sections = Array.from(new Set(rows.map((r) => r.section).filter((s): s is string => !!s)));
  return (
    <div className="space-y-5 px-4 py-5 sm:px-6">
      <PageHeader title={item.name} description="Edit what households see, or archive it." />
      <ProductForm slug={slug} kind={item.kind} product={item} sections={sections} />
      {itemFields && (
        <section className="max-w-2xl space-y-3 border-t border-line pt-5">
          <h2 className="text-base font-semibold text-ink">{VENDOR_TYPE_INFO[type].label} details</h2>
          <TypeFieldsForm slug={slug} type={type} itemId={item.id} initial={details.get(item.id) ?? {}} submitLabel="Save details" compact />
        </section>
      )}
    </div>
  );
}
