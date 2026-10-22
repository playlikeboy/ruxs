import type { Metadata } from "next";
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
        <h1 className="text-xl font-black tracking-tight text-kids-ink">
          Kids Classes & Activities 🚀
        </h1>
        <p className="mt-0.5 text-xs font-semibold text-kids-ink/60">
          Book 1:1 home sessions or studio batches with verified mentors
        </p>
      </div>

      <KidsActivitiesView initialActivities={activities} />
    </div>
  );
}
