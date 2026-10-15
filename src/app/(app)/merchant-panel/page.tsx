import { redirect } from "next/navigation";
import Link from "next/link";
import { eq, and, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { vendors, vendorMembers, vendorInvites } from "@/db/schema";
import { hexclave } from "@/lib/auth/hexclave";
import { isUserAdmin } from "@/lib/auth/session";
import { NotMerchantCard } from "@/features/vendors/components/not-merchant-card";

export default async function MerchantEntryPage() {
  const user = await hexclave.getUser();
  if (!user) {
    redirect("/merchant-panel/sign-in");
  }

  const db = getDb();

  // Accept owner/staff invites only when the authentication provider confirms
  // the primary email address. The exact email is the invite's login identity.
  const userEmail = user.primaryEmail?.toLowerCase();
  if (userEmail && user.primaryEmailVerified) {
    const pendingInvites = await db
      .select()
      .from(vendorInvites)
      .where(and(eq(vendorInvites.email, userEmail), isNull(vendorInvites.acceptedAt)));

    for (const invitation of pendingInvites) {
      await db
        .insert(vendorMembers)
        .values({
          vendorId: invitation.vendorId,
          userId: user.id,
          role: invitation.role,
        })
        .onConflictDoNothing();

      await db
        .update(vendorInvites)
        .set({
          acceptedAt: new Date(),
          acceptedUserId: user.id,
        })
        .where(eq(vendorInvites.id, invitation.id));
    }
  }

  const userVendors = await db
    .select({
      vendor: vendors,
      member: vendorMembers,
    })
    .from(vendorMembers)
    .innerJoin(vendors, eq(vendorMembers.vendorId, vendors.id))
    .where(eq(vendorMembers.userId, user.id));

  if (userVendors.length === 0) {
    if (userEmail && !user.primaryEmailVerified) {
      const [pendingInvite] = await db
        .select()
        .from(vendorInvites)
        .where(and(eq(vendorInvites.email, userEmail), isNull(vendorInvites.acceptedAt)))
        .limit(1);

      if (pendingInvite) {
        return (
          <div className="space-y-4 rounded-[14px] border border-line bg-surface p-6 text-center">
            <h2 className="text-xl font-semibold text-ink">Verify your email</h2>
            <p className="text-sm text-muted">
              Your merchant portal has been provisioned for <strong>{userEmail}</strong>.
              Please verify your email address to link and access your business dashboard.
            </p>
            <div className="pt-2">
              <Link
                href="/handler/email-verification"
                className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Verify Email →
              </Link>
            </div>
          </div>
        );
      }
    }

    if (isUserAdmin(user)) {
      redirect("/admin");
    }

    return (
      <div className="fixed inset-0 z-10 flex items-center justify-center overflow-y-auto bg-[#141311] px-6">
        <div className="w-full max-w-sm">
          <NotMerchantCard email={user.primaryEmail} />
        </div>
      </div>
    );
  }

  if (userVendors.length === 1) {
    redirect("/merchant-panel/" + userVendors[0]!.vendor.slug + "/today");
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Select a business</h1>
        <p className="text-sm text-muted">Choose the merchant portal you want to manage.</p>
      </div>
      <div className="space-y-3">
        {userVendors.map(({ vendor, member }) => (
          <Link
            key={vendor.id}
            href={"/merchant-panel/" + vendor.slug + "/today"}
            className="block rounded-[12px] border border-line bg-surface p-4 transition-colors hover:border-accent"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-medium text-ink">{vendor.name}</h2>
                <p className="text-sm text-muted">{vendor.area}, {vendor.city}</p>
              </div>
              <span className="rounded-full border border-line bg-bg px-2.5 py-1 text-xs capitalize text-muted">{member.role}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
