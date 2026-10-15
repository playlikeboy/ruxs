import Link from "next/link";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { vendorMembers, vendorInvites } from "@/db/schema";
import { requireVendorAccess } from "@/lib/auth/session";
import { InviteStaffForm } from "@/features/vendors/components/invite-staff-form";
import { StorefrontForm } from "@/features/vendors/components/storefront-form";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ vendor: string }>;
}) {
  const { vendor: slug } = await params;
  const access = await requireVendorAccess(slug, ["owner"]);
  const db = getDb();

  const [members, invites] = await Promise.all([
    db
      .select()
      .from(vendorMembers)
      .where(eq(vendorMembers.vendorId, access.vendorId)),
    db
      .select()
      .from(vendorInvites)
      .where(eq(vendorInvites.vendorId, access.vendorId)),
  ]);

  const pendingInvites = invites.filter((invite) => !invite.acceptedAt);

  return (
    <div className="max-w-3xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Settings</h1>
        <p className="mt-1 text-sm text-muted">Business details, payment configuration and team access.</p>
      </div>

      <section className="space-y-3 rounded-[12px] border border-line bg-surface p-4">
        <div>
          <h2 className="text-base font-semibold text-ink">Storefront &amp; delivery</h2>
          <p className="mt-1 text-sm text-muted">How your store appears in the RUXS app and who can order.</p>
        </div>
        <StorefrontForm
          slug={slug}
          initial={{
            description: access.vendor.description ?? "",
            coverUrl: access.vendor.coverUrl ?? "",
            latitude: access.vendor.latitude,
            longitude: access.vendor.longitude,
            serviceRadiusKm: access.vendor.serviceRadiusKm,
            deliveryFeePaise: access.vendor.deliveryFeePaise,
            minOrderPaise: access.vendor.minOrderPaise,
            acceptingOrders: access.vendor.acceptingOrders,
          }}
        />
      </section>

      <section className="space-y-3 rounded-[12px] border border-line bg-surface p-4">
        <h2 className="text-base font-semibold text-ink">Business profile</h2>
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted">Business name</dt>
            <dd className="mt-1 font-medium text-ink">{access.vendor.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Store page</dt>
            <dd className="mt-1 break-all font-mono text-ink">ruxs.in/app/store/{access.vendor.slug}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Area / city</dt>
            <dd className="mt-1 font-medium text-ink">{access.vendor.area}, {access.vendor.city}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Contact phone</dt>
            <dd className="mt-1 font-mono text-ink">{access.vendor.phone}</dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3 rounded-[12px] border border-line bg-surface p-4">
        <h2 className="text-base font-semibold text-ink">UPI payment details</h2>
        <p className="text-sm leading-6 text-muted">Households pay bills directly to your UPI ID. RUXS creates the UPI link and never holds your money.</p>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-line bg-bg p-3">
          <div>
            <p className="text-xs text-muted">Direct UPI VPA</p>
            <p className="mt-1 font-mono text-sm font-semibold text-ink">{access.vendor.upiVpa}</p>
          </div>
          <span className="rounded-full bg-good/10 px-2 py-1 text-xs font-semibold text-good">Active</span>
        </div>
      </section>

      <section className="space-y-4 rounded-[12px] border border-line bg-surface p-4">
        <div>
          <h2 className="text-base font-semibold text-ink">Team & staff access</h2>
          <p className="mt-1 text-sm leading-6 text-muted">Invite drivers or kitchen staff with their email addresses. Access is granted after they sign in with the same verified email.</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Active team ({members.length})</p>
          {members.length === 0 ? (
            <p className="text-sm text-muted">No team members have joined yet.</p>
          ) : members.map((member) => (
            <div key={member.userId} className="flex items-center justify-between gap-3 border-t border-line py-3 text-sm">
              <span className="font-mono text-xs text-muted">User ID: {member.userId.substring(0, 8)}…</span>
              <span className="rounded-full border border-line bg-bg px-2 py-1 text-xs font-medium capitalize text-ink">{member.role}</span>
            </div>
          ))}
        </div>

        {pendingInvites.length > 0 && (
          <div className="space-y-2 border-t border-line pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Pending invites ({pendingInvites.length})</p>
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-2 last:border-0">
                <span className="text-sm font-medium text-ink">{invite.email}</span>
                <span className="rounded-full bg-warn/10 px-2 py-1 text-xs font-semibold capitalize text-warn">{invite.role} · pending</span>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-line pt-4">
          <h3 className="mb-2 text-sm font-semibold text-ink">Invite a team member</h3>
          <InviteStaffForm slug={slug} />
        </div>
      </section>

      <section className="space-y-3 rounded-[12px] border border-line bg-surface p-4">
        <h2 className="text-base font-semibold text-ink">Your catalogue, your prices</h2>
        <p className="text-sm leading-6 text-muted">
          Set prices independently for this business&apos;s meals, water cans, deposits and products. Another vendor can sell a similar item at a different price. Existing orders keep their recorded price when you update your catalogue.
        </p>
        <Link href={"/merchant-panel/" + slug + "/products"} className="inline-flex min-h-10 items-center justify-center rounded-[10px] bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
          Manage products & prices →
        </Link>
      </section>
    </div>
  );
}
