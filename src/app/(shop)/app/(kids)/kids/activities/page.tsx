import type { Metadata } from "next";
import { Hint } from "@/components/ui/hint";
import { getKidsActivities } from "@/features/kids/queries";
import { KidsActivitiesView } from "@/features/kids/components/kids-activities-view";
import { KidsPageHeader } from "@/features/kids/components/kids-ui";
import { KIDS_AGE_BRACKETS, KIDS_CATEGORIES, type KidsAgeBracketId, type KidsCategoryId } from "@/core/kids";

export const metadata: Metadata = {
  title: "Kids classes · RUXs Kids",
  description: "Dance, music, chess, art, robotics and sports classes for children from providers near you.",
};

function pick(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export default async function KidsActivitiesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [activities, sp] = await Promise.all([getKidsActivities(), searchParams]);
  const age = pick(sp.age);
  const topic = pick(sp.topic);
  const initialAge = (KIDS_AGE_BRACKETS.some((b) => b.id === age) ? age : "all") as KidsAgeBracketId;
  const initialTopic = (Object.hasOwn(KIDS_CATEGORIES, topic) ? topic : "all") as KidsCategoryId;

  return (
    <div className="space-y-5">
      <KidsPageHeader title="Classes" lead="At home, at a studio or online." />
      <Hint id="kids-activities">Booking sends a request. The teacher confirms it and you get an email; you pay at the session.</Hint>
      <KidsActivitiesView
        initialActivities={activities}
        initialQuery={pick(sp.q).slice(0, 80)}
        initialAge={initialAge}
        initialTopic={initialTopic}
      />
    </div>
  );
}
