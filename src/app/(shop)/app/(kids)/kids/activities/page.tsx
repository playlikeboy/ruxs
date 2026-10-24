import type { Metadata } from "next";
import { Hint } from "@/components/ui/hint";
import { getKidsActivities } from "@/features/kids/queries";
import { KidsActivitiesView } from "@/features/kids/components/kids-activities-view";

export const metadata: Metadata = {
  title: "Kids Classes & Activities · RUXs Kids Zone",
  description:
    "Explore robotics, coding, chess, art, clay pottery, karate, and music classes for kids with local neighbourhood tutors and academies.",
};

export default async function KidsActivitiesPage() {
  const activities = await getKidsActivities();

  return (
    <div className="space-y-4">
      <div className="px-1">
        <h1 className="text-2xl font-bold tracking-tight text-kids-ink">Classes for kids</h1>
        <p className="mt-1 text-sm text-kids-ink/65">At home, at a studio or online, with providers reviewed by RUXs.</p>
      </div>

      <Hint id="kids-activities">Booking sends a request. The teacher confirms it and you get an email; you pay at the session.</Hint>
      <KidsActivitiesView initialActivities={activities} />
    </div>
  );
}
