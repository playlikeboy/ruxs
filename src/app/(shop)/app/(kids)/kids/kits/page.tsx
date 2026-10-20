import type { Metadata } from "next";
import { Package, Truck, ShieldCheck } from "lucide-react";
import { getKidsKits } from "@/features/kids/queries";
import { KidsKitCard } from "@/features/kids/components/kids-kit-card";

export const metadata: Metadata = {
  title: "DIY Learning Kits & Montessori Toys · RUXs Kids Zone",
  description:
    "Order hands-on science experiments, solar robotics, Montessori wooden math boards, and origami sets delivered to your doorstep.",
};

export default async function KidsKitsPage() {
  const kits = await getKidsKits();

  return (
    <div className="space-y-4">
      <div className="px-1">
        <div className="flex items-center gap-1.5 text-sky-600">
          <Package className="h-4 w-4" />
          <span className="text-[11px] font-black uppercase tracking-wider">Doorstep Delivery</span>
        </div>
        <h1 className="mt-0.5 text-xl font-black tracking-tight text-slate-950">
          DIY Learning & Science Kits 🧩
        </h1>
        <p className="mt-0.5 text-xs font-semibold text-slate-500">
          Hands-on screen-free activity boxes delivered to your doorstep
        </p>
      </div>

      <div className="flex items-center justify-between rounded-2xl border-2 border-slate-900 bg-amber-200/60 p-3 text-xs font-bold text-slate-900 shadow-[2px_2px_0_0_#0f172a]">
        <span className="flex items-center gap-1.5">
          <Truck className="h-4 w-4" />
          <span>Same / Next Day Delivery</span>
        </span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4" />
          <span>Non-Toxic & Safe</span>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {kits.map((kit) => (
          <KidsKitCard key={kit.id} item={kit} />
        ))}
      </div>
    </div>
  );
}
