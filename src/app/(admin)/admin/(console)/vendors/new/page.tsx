import Link from "next/link";
import { EMPTY_VENDOR, VendorForm } from "@/features/admin/components/vendor-form";
import { getCategories } from "@/features/platform/queries";
import { getApplication } from "@/features/applications/queries";

export const metadata = { title: "New vendor" };

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

export default async function NewVendorPage({ searchParams }: { searchParams: Promise<{ application?: string }> }) {
  const { application: applicationId } = await searchParams;
  const app = applicationId && /^[0-9a-f-]{36}$/.test(applicationId) ? await getApplication(applicationId) : null;
  const initial = app
    ? { ...EMPTY_VENDOR, name: app.businessName, slug: slugify(app.businessName), phone: app.phone, area: app.area, city: app.city, categoryId: app.categoryId, description: app.details ?? "", applicationId: app.id }
    : EMPTY_VENDOR;
  const categories = (await getCategories()).map((c) => ({ id: c.id, label: c.label, emoji: c.emoji, blurb: c.blurb, fulfilment: c.fulfilment, tint: c.tint }));
  return (
    <div className="max-w-3xl space-y-5 p-4 sm:p-6">
      <Link href="/admin/vendors" className="text-sm font-semibold text-muted hover:text-ink">← Vendors</Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New vendor</h1>
        <p className="mt-1 text-sm text-muted">Creates the store and a merchant login. The login ID is the store URL; the password is generated and shown once.</p>
      </div>
      <div className="rounded-[14px] border border-line bg-surface p-5">
        {app && (
          <p className="mb-4 rounded-[10px] bg-mint px-3 py-2 text-sm text-good">
            Prefilled from {app.ownerName}&apos;s application. Add their UPI ID and confirm the details you verified on the call.
          </p>
        )}
        <VendorForm initial={initial} categories={categories} />
      </div>
    </div>
  );
}
