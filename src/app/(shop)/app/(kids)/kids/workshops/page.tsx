import { UiIcon } from "@/components/ui/app-icon";
import type { Metadata } from "next";
import { Sparkles, Calendar } from "lucide-react";
import { getKidsWorkshops } from "@/features/kids/queries";
import { KidsWorkshopCard } from "@/features/kids/components/kids-workshop-card";

export const metadata: Metadata = {
  title: "Weekend Workshops & Camps · RUXs Kids Zone",
  description:
    "Fun, interactive weekend holiday bootcamps for kids: LEGO robotics, messy pottery, chess blitz, and sensory clay modelling.",
};

export default async function KidsWorkshopsPage() {
  const workshops = await getKidsWorkshops();

  return (
    <div className="space-y-4">
      <div className="px-1">
        <div className="flex items-center gap-1.5 text-amber-600">
          <Calendar className="h-4 w-4" />
          <span className="text-[11px] font-black uppercase tracking-wider">Holiday & Weekend</span>
        </div>
        <h1 className="mt-0.5 text-xl font-black tracking-tight text-kids-ink">
          Weekend Bootcamps & Workshops <UiIcon name="camp" />
        </h1>
        <p className="mt-0.5 text-xs font-semibold text-kids-ink/60">
          Intensive 2-hour holiday sessions with take-home projects and certificates
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {workshops.map((ws) => (
          <KidsWorkshopCard key={ws.id} item={ws} />
        ))}
      </div>

      <div className="mt-6 rounded-[26px] border-2 border-kids-grape/15 bg-sky-100 p-4 shadow-[0_3px_0_rgba(155,92,246,0.18)]">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-sky-800" />
          <h3 className="text-xs font-black text-kids-ink">Need a Custom Birthday or Group Camp?</h3>
        </div>
        <p className="mt-1 text-[11px] font-semibold text-kids-ink/80">
          We arrange private STEM, pottery, or chess bootcamps for apartment societies and birthday parties.
        </p>
      </div>
    </div>
  );
}
