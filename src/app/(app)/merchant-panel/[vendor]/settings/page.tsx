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
import { CardSection, PageHeader } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Settings" };

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
      <PageHeader title="Settings" description="Business details, payment configuration and team access." />

      <CardSection
        title={`${info.label} profile`}
        description={`Details only a ${info.label.toLowerCase()} needs. Households see the highlights on your page.`}
      >
        <TypeFieldsForm slug={slug} type={typeProfile.type} initial={typeProfile.values} submitLabel="Save profile" />
      </CardSection>

      <CardSection title="Business details" description="How your store appears in the RUXs app and who can order.">
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
            gstBps: access.vendor.gstBps,
            pricesIncludeGst: access.vendor.pricesIncludeGst,
            discountBps: access.vendor.discountBps,
          }}
        />
      </CardSection>

      <CardSection
        title="Team & staff access"
        description="Invite drivers or kitchen staff by email. They get access once they sign in with the same verified email."
      >
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted">Active team ({members.length})</h3>
          {members.length === 0 ? (
            <p className="text-sm text-muted">No team members have joined yet.</p>
          ) : members.map((member) => (
            <div key={member.userId} className="flex items-center justify-between gap-3 border-t border-line py-3 text-sm">
              <span className="font-mono text-xs text-muted">User ID: {member.userId.substring(0, 8)}…</span>
              <Badge className="capitalize">{member.role}</Badge>
            </div>
          ))}
        </div>

        {pendingInvites.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-line pt-3">
            <h3 className="text-sm font-semibold text-muted">Pending invites ({pendingInvites.length})</h3>
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-2 last:border-0">
                <span className="min-w-0 break-all text-sm font-medium text-ink">{invite.email}</span>
                <Badge tone="warn" className="capitalize">{invite.role} · pending</Badge>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 border-t border-line pt-4">
          <h3 className="mb-2 text-sm font-semibold text-ink">Invite a team member</h3>
          <InviteStaffForm slug={slug} />
        </div>
      </CardSection>

      <CardSection title="Password" description="Change the password you use at the merchant sign-in.">
        <ChangePasswordForm />
      </CardSection>

      {!provider && (
        <CardSection
          title="Your catalogue, your prices"
          description="You set your own prices. Existing orders keep the price they were placed at when you change your catalogue."
        >
          <ButtonLink href={"/merchant-panel/" + slug + "/products"} variant="secondary">
            Manage {info.nouns.catalogue.toLowerCase()}
          </ButtonLink>
        </CardSection>
      )}
    </div>
  );
}
