import { redirect } from "next/navigation";
import Link from "next/link";
import { eq, and, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { vendors, vendorMembers, vendorInvites } from "@/db/schema";
import { hexclave } from "@/lib/auth/hexclave";
import { AuthRedirect } from "@/components/auth/auth-redirect";

export default async function AppEntryPage() {
  const user = await hexclave.getUser();
  if (!user) {
    return <AuthRedirect />;
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
    redirect("/onboarding");
  }

  if (userVendors.length === 1) {
    redirect("/app/" + userVendors[0]!.vendor.slug + "/today");
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
            href={"/app/" + vendor.slug + "/today"}
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
