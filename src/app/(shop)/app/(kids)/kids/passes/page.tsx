import type { Metadata } from "next";
import { getAvailableHolidayPasses, getMyKidsPasses } from "@/features/kids/queries";
import { hexclave } from "@/lib/auth/hexclave";
import { PassesManager } from "@/features/kids/components/passes-manager";
import { KidsPageHeader } from "@/features/kids/components/kids-ui";

export const metadata: Metadata = {
  title: "Passes · RUXs Kids",
  description: "Holiday and weekend session passes for kids classes and workshops.",
};

export default async function KidsPassesPage() {
  const user = await hexclave.getUser();
  const [availablePasses, purchasedPasses] = await Promise.all([getAvailableHolidayPasses(), user ? getMyKidsPasses() : []]);

  return (
    <div className="space-y-5">
      <KidsPageHeader title="Passes" lead="Session credits for holiday and weekend classes." />
      <PassesManager availablePasses={availablePasses} purchasedPasses={purchasedPasses} isLoggedIn={!!user} />
    </div>
  );
}
