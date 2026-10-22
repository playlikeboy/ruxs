import Link from "next/link";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { vendorMembers, vendorInvites } from "@/db/schema";
import { requireVendorModule } from "@/lib/auth/session";
import { InviteStaffForm } from "@/features/vendors/components/invite-staff-form";
import { StorefrontForm } from "@/features/vendors/components/storefront-form";
import { TypeFieldsForm } from "@/features/vendor-types/components/type-fields-form";
import { ChangePasswordForm } from "@/features/vendor-types/components/change-password-form";
import { getMyTypeProfile } from "@/features/vendor-types/queries";
import { VENDOR_TYPE_INFO } from "@/core/vendor-types";
import { CardSection } from "@/components/ui/card";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ vendor: string }>;
}) {
  const { vendor: slug } = await params;
  const access = await requireVendorModule(slug, "settings", ["owner"]);
  const db = getDb();

  const info = VENDOR_TYPE_INFO[access.vendorType];
  const provider = info.fulfilment === "booking";
  const [members, invites, typeProfile] = await Promise.all([
    db
      .select()
      .from(vendorMembers)
      .where(eq(vendorMembers.vendorId, access.vendorId)),
    db
      .select()
      .from(vendorInvites)
      .where(eq(vendorInvites.vendorId, access.vendorId)),
    getMyTypeProfile(slug),
  ]);

  const pendingInvites = invites.filter((invite) => !invite.acceptedAt);

  return (
    <div className="max-w-3xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Settings</h1>
        <p className="mt-1 text-sm text-muted">Business details, payment configuration and team access.</p>
      </div>

      <CardSection
        title={`${info.emoji} ${info.label} profile`}
        description={`Details only a ${info.label.toLowerCase()} needs. Households see the highlights on your page.`}
      >
        <TypeFieldsForm slug={slug} type={typeProfile.type} initial={typeProfile.values} submitLabel="Save profile" />
      </CardSection>

      <section className="space-y-3 rounded-[12px] border border-line bg-surface p-4">
        <div>
          <h2 className="text-base font-semibold text-ink">Business details</h2>
          <p className="mt-1 text-sm text-muted">How your store appears in the RUXs app and who can order.</p>
        </div>
        <StorefrontForm
          slug={slug}
          provider={provider}
          initial={{
            name: access.vendor.name,
            phone: access.vendor.phone,
            upiVpa: access.vendor.upiVpa,
            area: access.vendor.area,
            city: access.vendor.city,
            mapsUrl: access.vendor.mapsUrl ?? "",
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

      <CardSection title="Password" description="Change the password you use at the merchant sign-in.">
        <ChangePasswordForm />
      </CardSection>

      {!provider && (
      <section className="space-y-3 rounded-[12px] border border-line bg-surface p-4">
        <h2 className="text-base font-semibold text-ink">Your catalogue, your prices</h2>
        <p className="text-sm leading-6 text-muted">
          Set prices independently for this business&apos;s meals, water cans, deposits and products. Another vendor can sell a similar item at a different price. Existing orders keep their recorded price when you update your catalogue.
        </p>
        <Link href={"/merchant-panel/" + slug + "/products"} className="inline-flex min-h-10 items-center justify-center rounded-[10px] bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
          Manage {info.nouns.catalogue.toLowerCase()} →
        </Link>
      </section>
      )}
    </div>
  );
}
