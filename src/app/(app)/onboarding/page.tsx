import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { vendorMembers } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const user = await requireUser();
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
    <div className="p-4 sm:p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Set up your business
        </h1>
        <p className="text-sm text-muted">
          Your tiffin kitchen or water supply service on one calm link.
        </p>
      </div>

      <OnboardingForm />
    </div>
  );
}
