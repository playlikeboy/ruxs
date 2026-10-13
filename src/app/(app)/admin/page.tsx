import Link from "next/link";
import { getAdminVendors } from "@/features/admin/queries";
import { VendorStatusButton } from "@/features/admin/components/vendor-status-button";
import { CreateVendorModal } from "@/features/admin/components/create-vendor-modal";
import { EmptyState } from "@/components/ui/empty-state";

export default async function AdminPage() {
  const vendorList = await getAdminVendors();

  const pending = vendorList.filter((v) => v.status === "pending");
  const active = vendorList.filter((v) => v.status === "active");
  const suspended = vendorList.filter((v) => v.status === "suspended");

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            RUXS Platform Admin
          </h1>
          <p className="text-xs text-muted">
            Manage vendor registrations, accounts, and access merchant portals.
          </p>
        </div>

        <div className="w-full sm:w-auto">
          <CreateVendorModal />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="p-3 bg-surface border border-line rounded-[10px]">
          <span className="text-muted block text-[11px]">Pending</span>
          <span className="text-lg font-bold text-[#9A5B00] tabular-nums font-mono">
            {pending.length}
          </span>
        </div>
        <div className="p-3 bg-surface border border-line rounded-[10px]">
          <span className="text-muted block text-[11px]">Active</span>
          <span className="text-lg font-bold text-good tabular-nums font-mono">
            {active.length}
          </span>
        </div>
        <div className="p-3 bg-surface border border-line rounded-[10px]">
          <span className="text-muted block text-[11px]">Suspended</span>
          <span className="text-lg font-bold text-[#B42318] tabular-nums font-mono">
            {suspended.length}
          </span>
        </div>
      </div>

      {/* Pending Approvals */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-ink flex items-center gap-1.5">
            <span>Pending Approvals</span>
            <span className="px-2 py-0.5 bg-[#FFF3C9] text-[#9A5B00] text-[10px] font-bold rounded-full">
              {pending.length}
            </span>
          </h2>

          <div className="space-y-2">
            {pending.map((v) => (
              <div
                key={v.id}
                className="p-4 bg-surface border border-[#9A5B00]/30 rounded-[12px] flex items-center justify-between text-xs shadow-xs"
              >
                <div>
                  <h3 className="font-semibold text-ink text-sm">{v.name}</h3>
                  <div className="text-muted text-[11px] mt-0.5">
                    {v.area}, {v.city} • UPI: {v.upiVpa}
                  </div>
                  <div className="text-muted text-[11px] mt-0.5 font-mono">
                    Slug: {v.slug} • {v.phone}
                  </div>
                </div>

                <VendorStatusButton vendorId={v.id} currentStatus={v.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Vendors */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-ink">All Vendors ({vendorList.length})</h2>

        {vendorList.length === 0 ? (
          <EmptyState
            title="No vendors yet"
            description="When users complete onboarding, their businesses will appear here for review."
          />
        ) : (
          <div className="space-y-2">
            {vendorList.map((v) => (
              <div
                key={v.id}
                className="p-3.5 bg-surface border border-line rounded-[12px] flex items-center justify-between text-xs shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink text-sm">{v.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                        v.status === "active"
                          ? "bg-[#E1F3E7] text-good"
                          : v.status === "pending"
                            ? "bg-[#FFF3C9] text-[#9A5B00]"
                            : "bg-[#FCE4EC] text-[#B42318]"
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>

                  <div className="text-muted text-[11px] mt-0.5">
                    {v.area}, {v.city} • Plan: {v.plan}
                  </div>

                  <div className="text-muted text-[11px] font-mono mt-0.5">
                    <Link
                      href={`/app/${v.slug}/today`}
                      className="text-accent hover:underline"
                    >
                      /app/{v.slug}
                    </Link>{" "}
                    • {v.phone}
                  </div>
                </div>

                <VendorStatusButton vendorId={v.id} currentStatus={v.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
