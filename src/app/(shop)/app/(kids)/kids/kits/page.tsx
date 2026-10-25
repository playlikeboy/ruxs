import type { Metadata } from "next";
import { getKidsKits } from "@/features/kids/queries";
import { KidsKitCard } from "@/features/kids/components/kids-kit-card";
import { KidsPageHeader, kidsCard } from "@/features/kids/components/kids-ui";
import { CoverArt } from "@/components/ui/cover-art";

export const metadata: Metadata = {
  title: "Learning kits · RUXs Kids",
  description: "Science, craft and puzzle kits for children, delivered by stores near you.",
};

export default async function KidsKitsPage() {
  const kits = await getKidsKits();

  return (
    <div className="space-y-5">
      <KidsPageHeader title="Learning kits" lead="Screen-free activity boxes, delivered by the store. Pay on delivery." />
      {kits.length === 0 ? (
        <div className={`${kidsCard} p-6 text-center`}>
          <CoverArt theme="kits" className="mx-auto h-24 w-32 rounded-[14px]" />
          <p className="mt-4 font-semibold">No kits near you yet</p>
          <p className="mt-1 text-sm text-kids-ink/65">Kits appear here when a store in your area lists them.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {kits.map((kit) => <KidsKitCard key={kit.id} item={kit} />)}
        </div>
      )}
    </div>
  );
}
