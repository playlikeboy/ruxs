import Link from "next/link";
import { Fredoka } from "next/font/google";
import { ArrowRight, ArrowUpRight, CalendarDays, GraduationCap, Package, ShoppingBag, type LucideIcon } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { buildMetadata, breadcrumbsJsonLd } from "@/lib/seo";

const fredoka = Fredoka({ subsets: ["latin"], variable: "--font-fredoka", weight: ["500", "600"] });

export const metadata = buildMetadata({
  title: "Kids' Classes, Workshops & Learning Kits Near You",
  description:
    "Find dance, music, robotics, art, chess and tutoring classes near you, book workshops and holiday camps, and order DIY, robotics, science and art kits from the RUXs Store.",
  path: "/for/kids",
});

const zone: { icon: LucideIcon; name: string; detail: string; href: string; tint: string }[] = [
  {
    icon: GraduationCap,
    name: "Classes",
    detail: "Dance, music, robotics and coding, art and pottery, chess and academic tutors. Book a session or a pass.",
    href: "/app/kids/activities",
    tint: "bg-kids-mint",
  },
  {
    icon: CalendarDays,
    name: "Workshops & holiday camps",
    detail: "Weekend workshops and holiday camps from providers near you: dated sessions with a fixed number of seats.",
    href: "/app/kids/workshops",
    tint: "bg-kids-sky",
  },
  {
    icon: Package,
    name: "Learning kits",
    detail: "Activity and project kits from local kit providers, for making and learning at home.",
    href: "/app/kids/kits",
    tint: "bg-kids-sunny",
  },
  {
    icon: ShoppingBag,
    name: "RUXs Store",
    detail: "Our own shop: DIY and craft kits, robotics and electronics, science and lab kits, art and painting supplies, puzzles. Delivering in Ranchi for now.",
    href: "/app/kids/shop",
    tint: "bg-kids-peach",
  },
];

const steps = [
  { title: "Pick an age and an interest", body: "Filter Kids Zone by your child's age group and what they enjoy." },
  { title: "Request a time", body: "Choose a slot. The provider confirms it, and you see the status in your bookings." },
  { title: "Book with reviewed providers", body: "Kids providers are reviewed by RUXs before they can take bookings." },
];

export default function ForKidsPage() {
  return (
    <div className={`${fredoka.variable} space-y-16 px-4 pb-12 pt-10 sm:px-6 sm:pt-16`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbsJsonLd([
              { name: "Home", path: "/" },
              { name: "Kids' classes, workshops & kits", path: "/for/kids" },
            ]),
          ]),
        }}
      />

      <section aria-labelledby="kids-hero-title" className="mx-auto max-w-5xl rounded-[24px] bg-kids-cream px-5 py-10 text-kids-ink sm:px-10 sm:py-14">
        <h1 id="kids-hero-title" className="max-w-3xl text-balance font-kids text-4xl font-semibold leading-[1.08] sm:text-6xl">
          Classes, workshops and kits <span className="text-kids-grape">for curious kids.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-kids-ink/80 sm:text-lg sm:leading-8">
          RUXs Kids Zone brings together class providers, workshop hosts and kit makers near you, plus the RUXs Store for hands-on kits we sell ourselves. Each provider sets its own prices, schedule and area.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/app/kids" size="lg" className="px-6">
            Open Kids Zone <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </ButtonLink>
          <ButtonLink href="/app/kids/shop" variant="secondary" size="lg" className="px-6">
            <ShoppingBag className="h-4 w-4" aria-hidden="true" /> Shop the RUXs Store
          </ButtonLink>
        </div>
      </section>

      <section aria-labelledby="kids-zone-title" className="mx-auto max-w-5xl">
        <h2 id="kids-zone-title" className="font-kids text-2xl font-semibold text-kids-ink sm:text-3xl">
          What&apos;s in Kids Zone
        </h2>
        <ul className="mt-6 border-t-2 border-kids-ink">
          {zone.map((item) => (
            <li key={item.name} className="border-b border-line">
              <Link href={item.href} className="group flex items-center gap-4 py-5">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] text-kids-ink ${item.tint}`} aria-hidden="true">
                  <item.icon className="h-6 w-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-kids text-lg font-semibold text-kids-ink group-hover:text-accent">{item.name}</span>
                  <span className="mt-0.5 block text-sm leading-6 text-muted">{item.detail}</span>
                </span>
                <ArrowUpRight className="h-5 w-5 shrink-0 text-muted transition-colors group-hover:text-accent" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">What you see depends on the providers in your area.</p>
      </section>

      <section aria-labelledby="kids-steps-title" className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[0.9fr_1.1fr] md:gap-14">
        <h2 id="kids-steps-title" className="text-balance font-kids text-2xl font-semibold text-kids-ink sm:text-3xl">
          Booking a class, step by step.
        </h2>
        <ol className="space-y-5">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-kids-mint text-sm font-bold text-kids-ink tabular-nums">
                {i + 1}
              </span>
              <div>
                <p className="text-base font-semibold text-ink">{step.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="kids-merchant-title" className="mx-auto max-w-5xl rounded-[20px] bg-butter p-6 sm:p-9">
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <h2 id="kids-merchant-title" className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              Teach kids or run workshops?
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted">
              Class providers, academies, workshop hosts and kit makers can apply to list on RUXs. Providers are reviewed before they can take bookings, then manage classes, workshops and bookings from the merchant panel.
            </p>
          </div>
          <ButtonLink href="/apply" className="shrink-0 px-5">
            List your classes <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
