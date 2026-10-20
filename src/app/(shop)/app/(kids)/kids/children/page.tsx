import type { Metadata } from "next";
import { getMyChildren } from "@/features/kids/queries";
import { ChildrenManager } from "@/features/kids/components/children-manager";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Child Profiles · RUXs Kids Zone",
  description: "Manage your children's profiles for activities, school classes and workshop bookings.",
};

export default async function KidsChildrenPage() {
  const children = await getMyChildren();

  return (
    <div className="space-y-4">
      <div className="px-1">
        <h1 className="text-xl font-black tracking-tight text-slate-950">
          Child Profiles 👶
        </h1>
        <p className="mt-0.5 text-xs font-semibold text-slate-500">
          Manage your children for 1-click booking into age-appropriate activities & camps
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-slate-900/10 bg-white p-3 text-[11px] font-semibold text-slate-600 shadow-sm">
        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
        <span>Child profiles are completely private and never shared publicly.</span>
      </div>

      <ChildrenManager initialChildren={children} />
    </div>
  );
}
