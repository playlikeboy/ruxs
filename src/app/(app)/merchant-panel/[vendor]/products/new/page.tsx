import { PageHeader } from "@/components/ui/card";
import { requireVendorModule } from "@/lib/auth/session";
import { allowedCategoryIds } from "@/core/vendor-types";
import { getMenuForVendor } from "@/features/products/queries";
import { ProductForm } from "@/features/products/components/product-form";

export const metadata = { title: "New item" };

export default async function NewProductPage({ params, searchParams }: { params: Promise<{ vendor: string }>; searchParams: Promise<{ section?: string }> }) {
  const [{ vendor: slug }, { section = "" }] = await Promise.all([params, searchParams]);
  const access = await requireVendorModule(slug, "products", ["owner"]);
  const { rows } = await getMenuForVendor(slug);
  const sections = Array.from(new Set(rows.map((r) => r.section).filter((s): s is string => !!s)));
  return (
    <div className="space-y-5 px-4 py-5 sm:px-6">
      <PageHeader title="New item" description="Households see it on your store as soon as you save." />
      <ProductForm slug={slug} kind={allowedCategoryIds(access.vendorType, access.vendor.categoryId)[0]!} sections={sections} defaultSection={section.slice(0, 40)} />
    </div>
  );
}
