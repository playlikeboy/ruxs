import type { Metadata } from "next";
import { getAvailableHolidayPasses, getMyKidsPasses } from "@/features/kids/queries";
import { hexclave } from "@/lib/auth/hexclave";
import { PassesManager } from "@/features/kids/components/passes-manager";

export const metadata: Metadata = {
  title: "Holiday Camp Passes · RUXs Kids Zone",
  description:
    "Multi-session holiday passes for kids STEM, robotics, chess, pottery and creative workshops with verified neighbourhood mentors.",
};

export default async function KidsPassesPage() {
  const user = await hexclave.getUser();

  const [availablePasses, purchasedPasses] = await Promise.all([
    getAvailableHolidayPasses(),
    user ? getMyKidsPasses() : [],
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-12">
      <div className="px-1">
        <h1 className="text-xl font-black tracking-tight text-slate-950">
          Holiday & Weekend Activity Passes 🎟️
        </h1>
        <p className="mt-0.5 text-xs font-semibold text-slate-500">
          Save on classes and holiday workshops with flexible session credits
        </p>
      </div>

      <PassesManager
        availablePasses={availablePasses}
        purchasedPasses={purchasedPasses}
        isLoggedIn={!!user}
      />
    </div>
  );
}
