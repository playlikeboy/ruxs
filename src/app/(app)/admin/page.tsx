import Link from "next/link";
import { getAdminVendors } from "@/features/admin/queries";
import { VendorStatusButton } from "@/features/admin/components/vendor-status-button";
import { CreateVendorForm } from "@/features/admin/components/create-vendor-form";
import { VendorCredentialsModal } from "@/features/admin/components/vendor-credentials-modal";
import { EmptyState } from "@/components/ui/empty-state";

export default async function AdminPage() {
  const vendorList = await getAdminVendors();

  const pending = vendorList.filter((vendor) => vendor.status === "pending");
  const active = vendorList.filter((vendor) => vendor.status === "active");
  const suspended = vendorList.filter((vendor) => vendor.status === "suspended");

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">RUXS Platform Admin</h1>
        <p className="mt-1 text-sm text-muted">Provision merchant portals, invite business owners, review registrations and manage access.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-[12px] border border-line bg-surface p-4">
          <span className="block text-xs text-muted">Pending</span>
          <span className="mt-1 block font-mono text-2xl font-bold tabular-nums text-warn">{pending.length}</span>
        </div>
        <div className="rounded-[12px] border border-line bg-surface p-4">
          <span className="block text-xs text-muted">Active</span>
          <span className="mt-1 block font-mono text-2xl font-bold tabular-nums text-good">{active.length}</span>
        </div>
        <div className="rounded-[12px] border border-line bg-surface p-4">
          <span className="block text-xs text-muted">Suspended</span>
          <span className="mt-1 block font-mono text-2xl font-bold tabular-nums text-bad">{suspended.length}</span>
        </div>
      </div>

      <CreateVendorForm />

      {pending.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-ink">Pending merchant approvals ({pending.length})</h2>
          <div className="space-y-2">
            {pending.map((vendor) => (
              <div key={vendor.id} className="flex flex-col gap-3 rounded-[12px] border border-warn/30 bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-ink">{vendor.name}</h3>
                  <p className="mt-1 text-sm text-muted">{vendor.area}, {vendor.city} · {vendor.phone}</p>
                  <p className="mt-1 text-xs text-muted">UPI: {vendor.upiVpa} · URL: /merchant/{vendor.slug}</p>
                </div>
                <VendorStatusButton vendorId={vendor.id} currentStatus={vendor.status} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-ink">All vendors ({vendorList.length})</h2>
        {vendorList.length === 0 ? (
          <EmptyState title="No vendors yet" description="Create a vendor above or review registrations after owners onboard." />
        ) : (
          <div className="space-y-2">
            {vendorList.map((vendor) => (
              <div key={vendor.id} className="flex flex-col gap-3 rounded-[12px] border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-ink">{vendor.name}</h3>
                    <span className={vendor.status === "active" ? "rounded-full bg-good/10 px-2 py-0.5 text-xs font-semibold text-good" : vendor.status === "pending" ? "rounded-full bg-warn/10 px-2 py-0.5 text-xs font-semibold text-warn" : "rounded-full bg-bad/10 px-2 py-0.5 text-xs font-semibold text-bad"}>{vendor.status}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted">{vendor.area}, {vendor.city} · {vendor.phone}</p>
                  <p className="mt-1 break-all text-xs text-muted">UPI: {vendor.upiVpa}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-4">
                    <Link href={"/merchant/" + vendor.slug + "/today"} className="text-sm font-semibold text-accent hover:underline">Open merchant portal →</Link>
                    <VendorCredentialsModal
                      vendorId={vendor.id}
                      vendorName={vendor.name}
                      vendorSlug={vendor.slug}
                    />
                  </div>
                </div>
                <VendorStatusButton vendorId={vendor.id} currentStatus={vendor.status} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
