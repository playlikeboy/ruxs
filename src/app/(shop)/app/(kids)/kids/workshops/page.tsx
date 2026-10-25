import type { Metadata } from "next";
import { getKidsWorkshops } from "@/features/kids/queries";
import { KidsWorkshopCard } from "@/features/kids/components/kids-workshop-card";
import { KidsPageHeader, kidsCard } from "@/features/kids/components/kids-ui";
import { CoverArt } from "@/components/ui/cover-art";

export const metadata: Metadata = {
  title: "Workshops and camps · RUXs Kids",
  description: "Weekend and holiday workshops and camps for children from providers near you.",
};

export default async function KidsWorkshopsPage() {
  const workshops = await getKidsWorkshops();

  return (
    <div className="space-y-5">
      <KidsPageHeader title="Workshops and camps" lead="Dated sessions with a fixed number of seats." />
      {workshops.length === 0 ? (
        <div className={`${kidsCard} p-6 text-center`}>
          <CoverArt theme="camp" className="mx-auto h-24 w-32 rounded-[14px]" />
          <p className="mt-4 font-semibold">No workshops scheduled right now</p>
          <p className="mt-1 text-sm text-kids-ink/65">New dates appear here as providers add them.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {workshops.map((ws) => <KidsWorkshopCard key={ws.id} item={ws} />)}
        </div>
      )}
    </div>
  );
}
