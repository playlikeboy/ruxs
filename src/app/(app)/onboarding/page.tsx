import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { vendorMembers } from "@/db/schema";
import { hexclave } from "@/lib/auth/hexclave";
import { OnboardingForm } from "./onboarding-form";
import { getCategories } from "@/features/platform/queries";

export default async function OnboardingPage() {
  const user = await hexclave.getUser();
  if (!user) {
    redirect("/sign-in");
  }

  const db = getDb();

  // If already a member of a vendor, redirect to /app
  const [existing] = await db
    .select({ vendorId: vendorMembers.vendorId })
    .from(vendorMembers)
    .where(eq(vendorMembers.userId, user.id))
    .limit(1);

  if (existing) {
    redirect("/app");
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4 pb-20 sm:p-6">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
          For local businesses
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Bring your business to RUXs
        </h1>
        <p className="text-sm leading-6 text-muted">
          From meals and water delivery to kids’ classes, gifts, beauty and other neighbourhood services, create a workspace for the way you work.
        </p>
      </div>

      <div className="rounded-[12px] border border-line bg-surface p-4">
        <p className="text-sm font-semibold text-ink">Before you start</p>
        <p className="mt-1 text-sm leading-6 text-muted">
          Have your business name, Indian mobile number, location and UPI ID handy. New listings are reviewed before they can accept orders.
        </p>
      </div>

      <OnboardingForm categories={(await getCategories()).map((c) => ({ id: c.id, label: c.label, emoji: c.emoji, blurb: c.blurb }))} />
    </div>
  );
}
