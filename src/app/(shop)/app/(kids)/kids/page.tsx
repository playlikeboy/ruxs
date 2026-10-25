import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { CoverArt } from "@/components/ui/cover-art";
import { Hint } from "@/components/ui/hint";
import { KidsActivityCard } from "@/features/kids/components/kids-activity-card";
import { KidsWorkshopCard } from "@/features/kids/components/kids-workshop-card";
import { KidsKitCard } from "@/features/kids/components/kids-kit-card";
import { KidsSafetyGuarantee } from "@/features/kids/components/kids-safety-guarantee";
import { KidsSection, kidsCard, kidsPrimaryButton } from "@/features/kids/components/kids-ui";
import { ModeSwitch } from "@/features/consumer/components/mode-switch";
import { getKidsActivities, getKidsKits, getKidsWorkshops } from "@/features/kids/queries";
import { KIDS_AGE_BRACKETS, KIDS_CATEGORIES, type KidsCategoryId } from "@/core/kids";

export const metadata = { title: "RUXs Kids" };

const TOPICS: KidsCategoryId[] = ["stem", "arts", "logic", "sports", "music", "kits"];

const FAMILY = [
  { href: "/app/kids/bookings", label: "Bookings & requests", sub: "Upcoming classes, confirmed dates", emoji: "📅", badgeBg: "bg-sky-100", badgeColor: "text-sky-900" },
  { href: "/app/kids/children", label: "Little learners", sub: "Child profiles used when you book", emoji: "🧸", badgeBg: "bg-pink-100", badgeColor: "text-pink-900" },
  { href: "/app/kids/passes", label: "Session passes", sub: "Holiday and weekend class credits", emoji: "🎟️", badgeBg: "bg-amber-100", badgeColor: "text-amber-900" },
];

export default async function KidsHomePage() {
  const [activities, workshops, kits] = await Promise.all([getKidsActivities(), getKidsWorkshops(), getKidsKits()]);
  const nothingNearby = activities.length === 0 && workshops.length === 0 && kits.length === 0;

  return (
    <div className="space-y-7">
      <ModeSwitch className="mb-1" />
      <section className="group relative overflow-hidden rounded-[24px] bg-white ring-1 ring-kids-ink/10 shadow-xs">
        <CoverArt theme="kids" live className="h-36 w-full sm:h-44" />
        <div className="p-5 pt-4">
          <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-kids-sunny/60 px-3 py-1 text-xs font-semibold text-kids-ink">
            <span className="text-sm">✨</span>
            <span>Learning &amp; Fun Near Home</span>
          </div>
          <h1 className="font-kids text-[28px] font-semibold leading-[1.1] tracking-tight text-kids-ink sm:text-[32px]">
            Classes, camps and kits for your child
          </h1>
          <p className="mt-1.5 text-[15px] text-kids-ink/70">From verified local teachers &amp; studios. Pay at the session.</p>
          <form action="/app/kids/activities" className="relative mt-4">
            <label htmlFor="kids-search" className="sr-only">Search classes</label>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-kids-ink/40" aria-hidden="true" />
            <input
              id="kids-search"
              name="q"
              type="search"
              placeholder="Dance, chess, robotics, art, pottery… 🎨"
              className="min-h-12 w-full rounded-full border border-kids-ink/15 bg-kids-cream pl-11 pr-20 text-base placeholder:text-kids-ink/40 focus:border-kids-ink focus:outline-none"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-9 items-center justify-center rounded-full bg-kids-ink px-4 text-xs font-bold text-white transition-all hover:bg-kids-ink/90 active:scale-95"
            >
              Find 🚀
            </button>
          </form>
        </div>
      </section>

      <Hint id="kids-home">💡 Pick an age or topic to explore. Booking sends a request directly to the teacher — pay at the session!</Hint>

      {nothingNearby ? (
        <div className={`${kidsCard} p-6 text-center shadow-xs`}>
          <CoverArt theme="camp" className="mx-auto h-24 w-32 rounded-[16px]" />
          <p className="mt-4 font-kids text-lg font-semibold text-kids-ink">No kids classes near you yet</p>
          <p className="mt-1 text-sm text-kids-ink/65">We show providers that serve your area. Check your address, or come back soon.</p>
          <Link href="/app/account" className={`${kidsPrimaryButton} mt-4`}>Check my address</Link>
        </div>
      ) : (
        <>
          <section aria-labelledby="age-title" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 id="age-title" className="font-kids text-xl font-semibold tracking-tight text-kids-ink">Child&apos;s age</h2>
              <span className="rounded-full bg-kids-sunny/60 px-2.5 py-0.5 text-[11px] font-bold text-kids-ink">Pick a bracket</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {KIDS_AGE_BRACKETS.filter((b) => b.id !== "all").map((b) => {
                const tints: Record<string, { bg: string; border: string }> = {
                  "3-5": { bg: "bg-pink-50/70", border: "border-pink-200/80 hover:border-pink-300" },
                  "6-8": { bg: "bg-sky-50/70", border: "border-sky-200/80 hover:border-sky-300" },
                  "9-12": { bg: "bg-amber-50/70", border: "border-amber-200/80 hover:border-amber-300" },
                  "13+": { bg: "bg-emerald-50/70", border: "border-emerald-200/80 hover:border-emerald-300" },
                };
                const tint = tints[b.id] ?? { bg: "bg-white", border: "border-kids-ink/10 hover:border-kids-ink/30" };
                return (
                  <Link
                    key={b.id}
                    href={`/app/kids/activities?age=${encodeURIComponent(b.id)}`}
                    className={`group flex items-center gap-3 rounded-[18px] border ${tint.border} ${tint.bg} p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(23,71,55,0.06)] active:scale-[0.98]`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6">
                      {b.emoji}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-kids text-[15px] font-semibold leading-tight text-kids-ink">{b.label}</span>
                      <span className="mt-0.5 block truncate text-[12px] font-medium text-kids-ink/65 leading-tight">{b.tagline}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="topic-title" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 id="topic-title" className="font-kids text-xl font-semibold tracking-tight text-kids-ink">Topics</h2>
              <span className="text-xs font-semibold text-kids-ink/60">6 activities</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {TOPICS.map((id) => (
                <Link
                  key={id}
                  href={id === "kits" ? "/app/kids/kits" : `/app/kids/activities?topic=${id}`}
                  className="group overflow-hidden rounded-[18px] border border-kids-ink/10 bg-white transition-all duration-200 hover:border-kids-ink/30 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(23,71,55,0.06)] active:scale-[0.98]"
                >
                  <CoverArt theme={id} className="aspect-[4/3] w-full" />
                  <span className="flex items-center justify-center gap-1.5 px-2 py-2 text-[13px] font-semibold leading-tight text-kids-ink">
                    <span className="text-sm transition-transform duration-200 group-hover:scale-125">{KIDS_CATEGORIES[id].emoji}</span>
                    <span className="truncate">{KIDS_CATEGORIES[id].shortLabel}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {activities.length > 0 && (
            <KidsSection title="⭐ Popular classes" href="/app/kids/activities">
              <div className="grid gap-3">
                {activities.slice(0, 4).map((a) => <KidsActivityCard key={a.id} item={a} />)}
              </div>
            </KidsSection>
          )}

          {workshops.length > 0 && (
            <KidsSection title="🎪 Workshops and camps" href="/app/kids/workshops">
              <div className="grid gap-3">
                {workshops.slice(0, 2).map((w) => <KidsWorkshopCard key={w.id} item={w} />)}
              </div>
            </KidsSection>
          )}

          {kits.length > 0 && (
            <KidsSection title="📦 Learning kits" href="/app/kids/kits" linkLabel="All kits">
              <div className="grid gap-3">
                {kits.slice(0, 2).map((k) => <KidsKitCard key={k.id} item={k} />)}
              </div>
            </KidsSection>
          )}
        </>
      )}

      <section aria-labelledby="family-title" className="space-y-3">
        <h2 id="family-title" className="font-kids text-xl font-semibold tracking-tight text-kids-ink">💛 Your family</h2>
        <ul className={`${kidsCard} divide-y divide-kids-ink/10 overflow-hidden shadow-xs`}>
          {FAMILY.map(({ href, label, sub, emoji, badgeBg, badgeColor }) => (
            <li key={href}>
              <Link href={href} className="group flex min-h-16 items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-kids-cream/40">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${badgeBg} ${badgeColor} text-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-transform duration-200 group-hover:scale-110`}>
                  {emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-kids text-[15px] font-semibold text-kids-ink">{label}</span>
                  <span className="block truncate text-[13px] text-kids-ink/65">{sub}</span>
                </span>
                <ChevronRight className="h-5 w-5 text-kids-ink/40 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <KidsSafetyGuarantee />
    </div>
  );
}
