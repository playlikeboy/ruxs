import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { vendorMembers, vendorInvites } from "@/db/schema";
import { requireVendorAccess } from "@/lib/auth/session";
import { InviteStaffForm } from "@/features/vendors/components/invite-staff-form";

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

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Settings
        </h1>
        <p className="text-xs text-muted">
          Business details, payment configuration, and team access
        </p>
      </div>

      {/* Business Details */}
      <div className="bg-surface border border-line rounded-[12px] p-4 space-y-3 shadow-xs">
        <h2 className="text-sm font-semibold text-ink">Business Profile</h2>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-muted block text-[11px]">Business Name</span>
            <span className="font-medium text-ink">{access.vendor.name}</span>
          </div>

          <div>
            <span className="text-muted block text-[11px]">Public URL</span>
            <span className="font-mono text-ink">ruxs.in/app/{access.vendor.slug}</span>
          </div>

          <div>
            <span className="text-muted block text-[11px]">Area / City</span>
            <span className="font-medium text-ink">
              {access.vendor.area}, {access.vendor.city}
            </span>
          </div>

          <div>
            <span className="text-muted block text-[11px]">Contact Phone</span>
            <span className="font-mono text-ink">{access.vendor.phone}</span>
          </div>
        </div>
      </div>

      {/* UPI Payment Configuration */}
      <div className="bg-surface border border-line rounded-[12px] p-4 space-y-2 shadow-xs text-xs">
        <h2 className="text-sm font-semibold text-ink">UPI Payment Details</h2>
        <p className="text-muted leading-relaxed">
          Households pay bills directly to your UPI ID. RUXS generates the universal deep link and never touches your money.
        </p>

        <div className="p-3 bg-[#FAFAF7] rounded-[10px] flex items-center justify-between mt-2">
          <div>
            <span className="text-[11px] text-muted block">Direct UPI VPA</span>
            <span className="font-mono font-semibold text-ink text-sm">
              {access.vendor.upiVpa}
            </span>
          </div>
          <span className="px-2 py-0.5 bg-[#E1F3E7] text-good text-[11px] font-semibold rounded-full">
            Active
          </span>
        </div>
      </div>

      {/* Team & Invites */}
      <div className="bg-surface border border-line rounded-[12px] p-4 space-y-4 shadow-xs">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-ink">Team & Staff Access</h2>
          <p className="text-xs text-muted">
            Invite drivers or kitchen staff. They sign in with their email and see today&apos;s run sheet.
          </p>
        </div>

        {/* Existing team members */}
        <div className="space-y-2">
          <span className="text-[11px] font-medium text-muted uppercase tracking-wider block">
            Active Team ({members.length})
          </span>
          <div className="divide-y divide-line/60">
            {members.map((m) => (
              <div
                key={m.userId}
                className="py-2 flex items-center justify-between text-xs"
              >
                <span className="font-mono text-muted text-[11px]">
                  User ID: {m.userId.substring(0, 8)}...
                </span>
                <span className="px-2 py-0.5 bg-[#FAFAF7] border border-line rounded-full font-medium capitalize text-ink">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending invites */}
        {invites.filter((i) => !i.acceptedAt).length > 0 && (
          <div className="space-y-2 pt-2 border-t border-line/60">
            <span className="text-[11px] font-medium text-muted uppercase tracking-wider block">
              Pending Invites
            </span>
            <div className="divide-y divide-line/60">
              {invites
                .filter((i) => !i.acceptedAt)
                .map((inv) => (
                  <div
                    key={inv.id}
                    className="py-2 flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-ink">{inv.email}</span>
                    <span className="px-2 py-0.5 bg-[#FFF3C9] text-[#9A5B00] rounded-full text-[10px] font-semibold capitalize">
                      Pending ({inv.role})
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Invite form */}
        <div className="pt-2 border-t border-line/60">
          <span className="text-xs font-semibold text-ink block mb-1">
            Invite New Member
          </span>
          <InviteStaffForm slug={slug} />
        </div>
      </div>

      {/* Plan Details */}
      <div className="bg-surface border border-line rounded-[12px] p-4 space-y-2 shadow-xs text-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Subscription Plan</h2>
          <span className="px-2 py-0.5 bg-[#E1F3E7] text-good font-semibold rounded-full capitalize">
            {access.vendor.plan} Plan
          </span>
        </div>
        <p className="text-muted leading-relaxed">
          {access.vendor.plan === "free"
            ? "Free tier: Up to 20 households with full run sheets and khata included."
            : "Unlimited households, priority routes, and multi-staff access."}
        </p>
      </div>
    </div>
  );
}
