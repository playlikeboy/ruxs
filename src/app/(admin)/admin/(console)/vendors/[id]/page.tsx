import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { formatINR } from "@/core/money";
import { getAdminVendor } from "@/features/admin/queries";
import { computeVendorBalance } from "@/features/payouts/queries";
import { VendorForm } from "@/features/admin/components/vendor-form";
import { CredentialsPanel } from "@/features/admin/components/credentials-panel";
import { VendorStatusControls } from "@/features/admin/components/vendor-status-controls";
import { getAdminVendorReviews } from "@/features/reviews/queries";
import { summarizeRatings } from "@/core/ratings";
import { Stars } from "@/features/reviews/components/rating-badge";
import { HideReviewButton } from "@/features/reviews/components/moderation-buttons";

export const metadata = { title: "Vendor" };

function str(n: number | null) {
  return n == null ? "" : String(n);
}

export default async function AdminVendorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getAdminVendor(id);
  if (!data) notFound();
  const { vendor, members, stats } = data;
  const [balance, reviews] = await Promise.all([computeVendorBalance(vendor.id, vendor.commissionBps), getAdminVendorReviews(vendor.id)]);
  const rating = summarizeRatings(reviews.filter((r) => !r.isHidden).map((r) => r.rating));

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <Link href="/admin/vendors" className="text-sm font-semibold text-muted hover:text-ink">← Vendors</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{vendor.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {vendor.businessType === "booking" ? "Booking provider" : "Delivery store"} · {vendor.area}, {vendor.city} · <span className="capitalize">{vendor.status}</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-4 text-sm font-semibold">
            <Link href={`/merchant-panel/${vendor.slug}/today`} className="flex items-center gap-1 text-accent hover:underline">Open merchant panel <ExternalLink className="h-3.5 w-3.5" /></Link>
            <Link href={`/app/store/${vendor.slug}`} className="flex items-center gap-1 text-muted hover:underline">Store page <ExternalLink className="h-3.5 w-3.5" /></Link>
          </div>
        </div>
        <VendorStatusControls vendorId={vendor.id} status={vendor.status} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          ...(vendor.businessType === "booking"
            ? [
                { l: "Services", v: String(stats.services) },
                { l: "Clients", v: String(stats.customers) },
                { l: "Bookings", v: String(stats.bookings) },
              ]
            : [
                { l: "Menu items", v: String(stats.products) },
                { l: "Customers", v: String(stats.customers) },
                { l: "App orders", v: String(stats.orders) },
              ]),
          { l: "Rating", v: rating.average == null ? "New" : `${rating.average.toFixed(1)} ★ (${rating.count})` },
          { l: "Available payout", v: formatINR(balance.availablePaise) },
        ].map((s) => (
          <div key={s.l} className="rounded-[12px] border border-line bg-surface p-4">
            <p className="text-xs text-muted">{s.l}</p>
            <p className="mt-1 font-mono text-xl font-bold tabular-nums">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-[14px] border border-line bg-surface p-5">
          <h2 className="mb-4 text-base font-semibold">Store details</h2>
          <VendorForm
            initial={{
              vendorId: vendor.id,
              slug: vendor.slug,
              name: vendor.name,
              phone: vendor.phone,
              upiVpa: vendor.upiVpa,
              city: vendor.city,
              area: vendor.area,
              description: vendor.description ?? "",
              latitude: str(vendor.latitude),
              longitude: str(vendor.longitude),
              serviceRadiusKm: String(vendor.serviceRadiusKm),
              deliveryFeeRupees: String(vendor.deliveryFeePaise / 100),
              minOrderRupees: String(vendor.minOrderPaise / 100),
              commissionPercent: String(vendor.commissionBps / 100),
              plan: vendor.plan as "free" | "starter" | "pro",
              acceptingOrders: vendor.acceptingOrders,
              businessType: vendor.businessType as "delivery" | "booking",
              categoryId: vendor.categoryId ?? "",
              mapsUrl: vendor.mapsUrl ?? "",
            }}
          />
        </section>

        <div className="space-y-6">
          <section className="rounded-[14px] border border-line bg-surface p-5">
            <h2 className="mb-3 text-base font-semibold">Merchant login</h2>
            <CredentialsPanel vendorId={vendor.id} loginId={vendor.loginId} />
          </section>
          <section className="rounded-[14px] border border-line bg-surface p-5">
            <h2 className="mb-3 text-base font-semibold">Reviews ({reviews.length})</h2>
            {reviews.length === 0 ? (
              <p className="text-sm text-muted">No reviews yet.</p>
            ) : (
              <ul className="max-h-96 space-y-3 overflow-y-auto pr-1">
                {reviews.map((r) => (
                  <li key={r.id} className={"border-b border-line pb-3 text-sm last:border-0 " + (r.isHidden ? "opacity-60" : "")}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{r.author}</span>
                      <Stars value={r.rating} />
                    </div>
                    {r.comment && <p className="mt-1 text-muted">{r.comment}</p>}
                    <div className="mt-1 flex items-center justify-between text-xs text-muted">
                      <span>{r.isHidden ? "Hidden" : "Public"}</span>
                      <HideReviewButton reviewId={r.id} hidden={r.isHidden} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="rounded-[14px] border border-line bg-surface p-5">
            <h2 className="mb-3 text-base font-semibold">Team ({members.length})</h2>
            {members.length === 0 ? (
              <p className="text-sm text-muted">No one can sign in yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {members.map((m) => (
                  <li key={m.userId} className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-muted">{m.userId === vendor.loginUserId ? `${vendor.loginId} (login)` : m.userId.slice(0, 13) + "…"}</span>
                    <span className="rounded-full bg-bg px-2 py-0.5 text-xs capitalize">{m.role}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-muted">Owners invite staff and drivers from their panel&apos;s Store settings.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
