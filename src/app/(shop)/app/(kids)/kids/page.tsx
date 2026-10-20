import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { KidsHeroBanner } from "@/features/kids/components/kids-hero-banner";
import { KidsActivityCard } from "@/features/kids/components/kids-activity-card";
import { KidsWorkshopCard } from "@/features/kids/components/kids-workshop-card";
import { KidsKitCard } from "@/features/kids/components/kids-kit-card";
import { KidsSafetyGuarantee } from "@/features/kids/components/kids-safety-guarantee";
import { getKidsActivities, getKidsKits, getKidsWorkshops } from "@/features/kids/queries";
import { KIDS_AGE_BRACKETS } from "@/core/kids";

export const metadata = {
  title: "Kids Zone · Activities, Classes & DIY Kits",
};

export default async function KidsHomePage() {
  const [activities, workshops, kits] = await Promise.all([
    getKidsActivities(),
    getKidsWorkshops(),
    getKidsKits(),
  ]);

  const featuredActivities = activities.slice(0, 3);
  const featuredWorkshops = workshops.slice(0, 2);
  const featuredKits = kits.slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Cartoon Hero Banner */}
      <KidsHeroBanner />

      {/* Quick Age Brackets Explorer */}
      <div>
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">
            Pick by Age
          </span>
          <Link
            href="/app/kids/activities"
            className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
          >
            <span>All ages</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="no-scrollbar mt-2 flex items-center gap-2.5 overflow-x-auto pb-1">
          {KIDS_AGE_BRACKETS.filter((b) => b.id !== "all").map((bracket) => (
            <Link
              key={bracket.id}
              href={`/app/kids/activities`}
              className={`flex shrink-0 items-center gap-2 rounded-2xl border-2 border-slate-900 bg-white px-3.5 py-2 shadow-[2px_2px_0_0_#0f172a] transition active:translate-y-0.5`}
            >
              <span className="text-xl" aria-hidden="true">{bracket.emoji}</span>
              <div>
                <span className="block text-xs font-black leading-tight text-slate-900">
                  {bracket.label}
                </span>
                <span className="block text-[10px] font-semibold text-slate-500">
                  {bracket.tagline}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Classes & Trial Sessions */}
      <section className="space-y-3">
        <div className="flex items-end justify-between px-1">
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <h3 className="text-lg font-black tracking-tight text-slate-950">
                Popular Classes & Trials
              </h3>
            </div>
            <p className="text-xs font-semibold text-slate-500">
              Low-cost trial sessions to spark your child&apos;s interest
            </p>
          </div>
          <Link
            href="/app/kids/activities"
            className="text-xs font-black text-accent hover:underline shrink-0"
          >
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3.5">
          {featuredActivities.map((act) => (
            <KidsActivityCard key={act.id} item={act} />
          ))}
        </div>
      </section>

      {/* Upcoming Weekend Camps & Workshops */}
      {featuredWorkshops.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-end justify-between px-1">
            <div>
              <span className="text-lg font-black tracking-tight text-slate-950">
                🏕️ Weekend Workshops
              </span>
              <p className="text-xs font-semibold text-slate-500">
                2-hour hands-on holiday & weekend creative camps
              </p>
            </div>
            <Link
              href="/app/kids/workshops"
              className="text-xs font-black text-accent hover:underline shrink-0"
            >
              See schedule →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {featuredWorkshops.map((ws) => (
              <KidsWorkshopCard key={ws.id} item={ws} />
            ))}
          </div>
        </section>
      )}

      {/* DIY Science & Learning Kits */}
      {featuredKits.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-end justify-between px-1">
            <div>
              <span className="text-lg font-black tracking-tight text-slate-950">
                🧩 DIY Kits & Activity Boxes
              </span>
              <p className="text-xs font-semibold text-slate-500">
                Delivered straight to your doorstep
              </p>
            </div>
            <Link
              href="/app/kids/kits"
              className="text-xs font-black text-accent hover:underline shrink-0"
            >
              Shop kits →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {featuredKits.map((kit) => (
              <KidsKitCard key={kit.id} item={kit} />
            ))}
          </div>
        </section>
      )}

      {/* Trust & Safety Guarantee */}
      <KidsSafetyGuarantee />
    </div>
  );
}
