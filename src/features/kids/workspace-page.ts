import "server-only";
import { requireVendorModule } from "@/lib/auth/session";
import { todayIST } from "@/core/time";
import { defaultKidsCategory } from "@/core/kids/category-for-type";
import { getKidsCategories, getProviderKidsWorkspace } from "./queries";
import type { KidsClassValues } from "./components/kids-class-form";
import type { KidsWorkshopValues } from "./components/kids-workshop-form";

/** Everything a /merchant-panel/[vendor]/kids page needs, behind the kids module gate. */
export async function loadKidsWorkspace(slug: string) {
  const access = await requireVendorModule(slug, "kids");
  const [workspace, categories] = await Promise.all([getProviderKidsWorkspace(slug), getKidsCategories()]);
  const pendingReview = !(workspace.profile?.verificationStatus === "approved" && workspace.profile.safetyReviewStatus === "passed");
  const counts = { classes: workspace.services.length, workshops: workspace.workshops.length, children: workspace.bookings.length + workspace.enrollments.length };
  const list = categories.map((c) => ({ id: c.id, name: c.name }));
  return { ...workspace, categories: list, defaultCategoryId: defaultKidsCategory(access.vendorType, list), pendingReview, counts };
}

export function newClassValues(categoryId: string): KidsClassValues {
  return { title: "", categoryId, description: "", minAge: 4, maxAge: 12, durationMinutes: 60, priceRupees: 499, deliveryModes: ["studio"], materialFeePolicy: "included", materialFeeRupees: 0, suitableClasses: [] };
}

export function newWorkshopValues(categoryId: string): KidsWorkshopValues {
  const today = todayIST();
  return { title: "", categoryId, description: "", minAge: 5, maxAge: 12, startDate: today, endDate: today, enrollmentDeadline: `${today}T09:00`, venueOrMode: "studio", address: "", capacity: 12, priceRupees: 999, eligibleClasses: [] };
}

/** A stored deadline as the IST wall-clock value a datetime-local input expects. */
export function istLocalInput(d: Date) {
  return new Date(d.getTime() + 330 * 60_000).toISOString().slice(0, 16);
}
