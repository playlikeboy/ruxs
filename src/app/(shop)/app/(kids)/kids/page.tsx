import Link from "next/link";
import { CalendarDays, ChevronRight, Search, Ticket, UsersRound } from "lucide-react";
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
  { href: "/app/kids/bookings", label: "Bookings", sub: "Requests, upcoming classes and camps", icon: CalendarDays },
  { href: "/app/kids/children", label: "My children", sub: "Profiles used when you book", icon: UsersRound },
  { href: "/app/kids/passes", label: "Passes", sub: "Holiday and weekend session credits", icon: Ticket },
];

export default async function KidsHomePage() {
  const [activities, workshops, kits] = await Promise.all([getKidsActivities(), getKidsWorkshops(), getKidsKits()]);
  const nothingNearby = activities.length === 0 && workshops.length === 0 && kits.length === 0;

  return (
    <div className="space-y-7">
      <ModeSwitch className="mb-1" />
      <section className="group relative overflow-hidden rounded-[24px] bg-white ring-1 ring-kids-ink/10">
        <CoverArt theme="kids" live className="h-36 w-full sm:h-44" />
        <div className="p-5 pt-4">
          <h1 className="font-kids text-[28px] font-semibold leading-[1.1] tracking-tight sm:text-[32px]">
            Classes, camps and kits for your child
          </h1>
          <p className="mt-1.5 text-[15px] text-kids-ink/65">From teachers and studios near you. You pay at the session.</p>
          <form action="/app/kids/activities" className="relative mt-4">
            <label htmlFor="kids-search" className="sr-only">Search classes</label>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-kids-ink/40" aria-hidden="true" />
            <input
              id="kids-search"
              name="q"
              type="search"
              placeholder="Dance, chess, robotics, art…"
              className="min-h-12 w-full rounded-full border border-kids-ink/15 bg-kids-cream pl-11 pr-4 text-base placeholder:text-kids-ink/40 focus:border-kids-ink focus:outline-none"
            />
          </form>
        </div>
      </section>

      <Hint id="kids-home">Pick an age or a topic to narrow the list. Booking sends a request; the teacher confirms it.</Hint>

      {nothingNearby ? (
        <div className={`${kidsCard} p-6 text-center`}>
          <CoverArt theme="camp" className="mx-auto h-24 w-32 rounded-[14px]" />
          <p className="mt-4 text-lg font-semibold">No kids classes near you yet</p>
          <p className="mt-1 text-sm text-kids-ink/65">We show providers that serve your area. Check your address, or come back soon.</p>
          <Link href="/app/account" className={`${kidsPrimaryButton} mt-4`}>Check my address</Link>
        </div>
      ) : (
        <>
          <section aria-labelledby="age-title" className="space-y-3">
            <h2 id="age-title" className="font-kids text-xl font-semibold tracking-tight">Child&apos;s age</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {KIDS_AGE_BRACKETS.filter((b) => b.id !== "all").map((b) => (
                <Link
                  key={b.id}
                  href={`/app/kids/activities?age=${encodeURIComponent(b.id)}`}
                  className="rounded-[16px] border border-kids-ink/10 bg-white px-4 py-3 transition-colors hover:border-kids-ink/30"
                >
                  <span className="block text-base font-semibold">{b.label}</span>
                  <span className="block text-[13px] text-kids-ink/60">{b.tagline}</span>
                </Link>
              ))}
            </div>
          </section>

          <section aria-labelledby="topic-title" className="space-y-3">
            <h2 id="topic-title" className="font-kids text-xl font-semibold tracking-tight">Topics</h2>
            <div className="grid grid-cols-3 gap-2.5">
              {TOPICS.map((id) => (
                <Link
                  key={id}
                  href={id === "kits" ? "/app/kids/kits" : `/app/kids/activities?topic=${id}`}
                  className="group overflow-hidden rounded-[16px] border border-kids-ink/10 bg-white transition-colors hover:border-kids-ink/30"
                >
                  <CoverArt theme={id} className="aspect-[4/3] w-full" />
                  <span className="block px-2.5 py-2 text-[13px] font-semibold leading-tight">{KIDS_CATEGORIES[id].shortLabel}</span>
                </Link>
              ))}
            </div>
          </section>

          {activities.length > 0 && (
            <KidsSection title="Popular classes" href="/app/kids/activities">
              <div className="grid gap-3">
                {activities.slice(0, 4).map((a) => <KidsActivityCard key={a.id} item={a} />)}
              </div>
            </KidsSection>
          )}

          {workshops.length > 0 && (
            <KidsSection title="Workshops and camps" href="/app/kids/workshops">
              <div className="grid gap-3">
                {workshops.slice(0, 2).map((w) => <KidsWorkshopCard key={w.id} item={w} />)}
              </div>
            </KidsSection>
          )}

          {kits.length > 0 && (
            <KidsSection title="Learning kits" href="/app/kids/kits" linkLabel="All kits">
              <div className="grid gap-3">
                {kits.slice(0, 2).map((k) => <KidsKitCard key={k.id} item={k} />)}
              </div>
            </KidsSection>
          )}
        </>
      )}

      <section aria-labelledby="family-title" className="space-y-3">
        <h2 id="family-title" className="font-kids text-xl font-semibold tracking-tight">Your family</h2>
        <ul className={`${kidsCard} divide-y divide-kids-ink/10`}>
          {FAMILY.map(({ href, label, sub, icon: Icon }) => (
            <li key={href}>
              <Link href={href} className="flex min-h-16 items-center gap-3 px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-kids-mint/60">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold">{label}</span>
                  <span className="block truncate text-[13px] text-kids-ink/60">{sub}</span>
                </span>
                <ChevronRight className="h-5 w-5 text-kids-ink/40" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <KidsSafetyGuarantee />
    </div>
  );
}
