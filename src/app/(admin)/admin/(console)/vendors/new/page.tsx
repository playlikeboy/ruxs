import Link from "next/link";
import { EMPTY_VENDOR, VendorForm } from "@/features/admin/components/vendor-form";
import { getCategories } from "@/features/platform/queries";

export const metadata = { title: "New vendor" };

export default async function NewVendorPage() {
  const categories = (await getCategories()).map((c) => ({ id: c.id, label: c.label, emoji: c.emoji, blurb: c.blurb, fulfilment: c.fulfilment, tint: c.tint }));
  return (
    <div className="max-w-3xl space-y-5 p-4 sm:p-6">
      <Link href="/admin/vendors" className="text-sm font-semibold text-muted hover:text-ink">← Vendors</Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New vendor</h1>
        <p className="mt-1 text-sm text-muted">Creates the store and a merchant login. The login ID is the store URL; the password is generated and shown once.</p>
      </div>
      <div className="rounded-[14px] border border-line bg-surface p-5">
        <VendorForm initial={EMPTY_VENDOR} categories={categories} />
      </div>
    </div>
  );
}
