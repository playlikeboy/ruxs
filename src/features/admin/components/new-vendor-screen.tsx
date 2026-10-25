import Link from "next/link";
import { VendorForm } from "@/features/admin/components/vendor-form";
import { EMPTY_VENDOR, type OnboardCategory } from "@/features/admin/components/vendor-form-values";
import type { getApplication } from "@/features/applications/queries";

type Application = NonNullable<Awaited<ReturnType<typeof getApplication>>>;

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

/** Shell for /admin/vendors/new (pick a type) and /admin/vendors/new/[type] (fill the form). */
export function NewVendorScreen({
  categories,
  categoryId = "",
  unknownType,
  app,
}: {
  categories: OnboardCategory[];
  categoryId?: string;
  unknownType?: string;
  app: Application | null;
}) {
  const chosen = categories.find((c) => c.id === categoryId);
  const initial = {
    ...EMPTY_VENDOR,
    categoryId,
    businessType: chosen?.fulfilment === "booking" ? ("booking" as const) : ("delivery" as const),
    ...(app
      ? { name: app.businessName, slug: slugify(app.businessName), phone: app.phone, area: app.area, city: app.city, description: app.details ?? "", applicationId: app.id }
      : {}),
  };
  return (
    <div className="max-w-3xl space-y-5 p-4 sm:p-6">
      <Link href="/admin/vendors" className="text-sm font-semibold text-muted hover:text-ink">← Vendors</Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{chosen ? `New ${chosen.label.toLowerCase()} vendor` : "New vendor"}</h1>
        <p className="mt-1 text-sm text-muted">Creates the store and a merchant login. The login ID is the store URL; the password is generated and shown once.</p>
      </div>
      <div className="rounded-[14px] border border-line bg-surface p-5">
        {unknownType && (
          <p role="alert" className="mb-4 rounded-[10px] bg-butter px-3 py-2 text-sm text-warn">
            There is no business type called &ldquo;{unknownType}&rdquo;. Pick one below.
          </p>
        )}
        {app && (
          <p className="mb-4 rounded-[10px] bg-mint px-3 py-2 text-sm text-good">
            Prefilled from {app.ownerName}&apos;s application. Add their UPI ID and confirm the details you verified on the call.
          </p>
        )}
        {/* key: a fresh form per type, so switching type never carries stale state */}
        <VendorForm key={categoryId} initial={initial} categories={categories} />
      </div>
    </div>
  );
}
