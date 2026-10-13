import { redirect } from "next/navigation";
import Link from "next/link";
import { eq, and, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { vendors, vendorMembers, vendorInvites } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";

export default async function AppEntryPage() {
  const user = await requireUser();
  const db = getDb();

  // 1. Accept any pending invites for verified primary email
  const userEmail = user.primaryEmail?.toLowerCase();
  if (userEmail) {
    const pendingInvites = await db
      .select()
      .from(vendorInvites)
      .where(
        and(
          eq(vendorInvites.email, userEmail),
          isNull(vendorInvites.acceptedAt)
        )
      );

    for (const inv of pendingInvites) {
      await db
        .insert(vendorMembers)
        .values({
          vendorId: inv.vendorId,
          userId: user.id,
          role: inv.role,
        })
        .onConflictDoNothing();

      await db
        .update(vendorInvites)
        .set({
          acceptedAt: new Date(),
          acceptedUserId: user.id,
        })
        .where(eq(vendorInvites.id, inv.id));
    }
  }

  // 2. Fetch user's vendors
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
    redirect(`/app/${userVendors[0]!.vendor.slug}/today`);
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Select Kitchen or Business
        </h1>
        <p className="text-sm text-muted">
          You have access to multiple vendors. Choose one to continue.
        </p>
      </div>

      <div className="space-y-3">
        {userVendors.map(({ vendor, member }) => (
          <Link
            key={vendor.id}
            href={`/app/${vendor.slug}/today`}
            className="block p-4 bg-surface border border-line rounded-[12px] hover:border-accent transition-colors shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-medium text-ink">{vendor.name}</h2>
                <p className="text-xs text-muted">
                  {vendor.area}, {vendor.city}
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-[#FAFAF7] border border-line rounded-full capitalize text-muted">
                {member.role}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
