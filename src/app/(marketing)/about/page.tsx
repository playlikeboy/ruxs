import Link from "next/link";
import {
  breadcrumbsJsonLd,
  buildMetadata,
  organizationJsonLd,
  softwareApplicationJsonLd,
} from "@/lib/seo";
import {
  KhataCheckIllustration,
  ScooterIllustration,
  TiffinDabbaIllustration,
  WaterCanIllustration,
} from "@/components/marketing/illustrations";

export const metadata = buildMetadata({
  title: "About RUXS — Better Days for Local Essentials",
  description:
    "Meet RUXS: a calm, reliable operating system helping neighbourhood tiffin kitchens and water suppliers run their day and set their own prices.",
  path: "/about",
});

const principles = [
  {
    number: "01",
    title: "The people who keep a neighbourhood running",
    body: "The tiffin kitchen that gets lunch ready before the city wakes up. The water supplier who remembers every doorstep and every empty can. These businesses are essential, and their tools should respect the work they do.",
  },
  {
    number: "02",
    title: "Less chasing. More certainty.",
    body: "RUXS brings daily changes, cutoff counts, delivery routes and household accounts into one dependable rhythm. Fewer scattered messages means fewer missed instructions, less waste and clearer expectations.",
  },
  {
    number: "03",
    title: "Keep the relationship local",
    body: "Every merchant controls their own catalogue and prices. Customers pay that business directly. RUXS helps vendors grow without imposing a universal price list across different sellers.",
  },
];

const features = [
  {
    title: "One private link per household",
    text: "Customers can confirm, skip or request an extra without creating an account or installing an app.",
    illustration: <TiffinDabbaIllustration className="h-14 w-14" />,
    tint: "bg-peach",
  },
  {
    title: "A count the whole kitchen can trust",
    text: "At the chosen cutoff, the day settles into a clear order count so the team can prepare with confidence.",
    illustration: <WaterCanIllustration className="h-14 w-14" />,
    tint: "bg-sky",
  },
  {
    title: "A delivery run that makes sense",
    text: "A tidy run sheet groups nearby homes and sorts floors top-down, helping drivers spend less time figuring out where to go.",
    illustration: <ScooterIllustration className="h-16 w-20" />,
    tint: "bg-butter",
  },
  {
    title: "A khata both sides can understand",
    text: "Itemised records and bill links make the numbers easier to follow, with direct UPI payments to the business.",
    illustration: <KhataCheckIllustration className="h-14 w-14" />,
    tint: "bg-mint",
  },
];

export default function AboutPage() {
  return (
    <div className="overflow-hidden pb-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            organizationJsonLd(),
            softwareApplicationJsonLd(),
            breadcrumbsJsonLd([
              { name: "Home", path: "/" },
              { name: "About RUXS", path: "/about" },
            ]),
          ]),
        }}
      />

      <section className="mx-auto grid max-w-5xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-20 md:grid-cols-[1.08fr_0.92fr] md:gap-14">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-peach px-3 py-1.5 text-xs font-semibold text-ink">
            <span className="h-2 w-2 rounded-full bg-accent" />
            Made for the neighbourhood
          </span>
          <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-6xl">
            Essential work deserves <span className="text-accent">better tools.</span>
          </h1>
          <p className="max-w-xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
            RUXS is building a calmer way to run everyday services that make a house feel like home — starting with neighbourhood tiffin kitchens and 20L water suppliers.
          </p>
          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <Link href="/app" className="inline-flex min-h-12 items-center justify-center rounded-[10px] bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90">
              Get started <span aria-hidden="true" className="ml-2">→</span>
            </Link>
            <Link href="/for/tiffin-services" className="inline-flex min-h-12 items-center justify-center rounded-[10px] border border-line bg-surface px-6 py-3 text-sm font-semibold text-ink transition hover:bg-white">
              Explore merchant tools
            </Link>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2 text-xs font-medium text-muted">
            <span className="inline-flex items-center gap-2"><span className="text-good">✓</span> Merchant-set prices</span>
            <span className="inline-flex items-center gap-2"><span className="text-good">✓</span> No customer app</span>
            <span className="inline-flex items-center gap-2"><span className="text-good">✓</span> Direct UPI payments</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div aria-hidden="true" className="absolute inset-5 rotate-3 rounded-[36px] bg-peach" />
          <div className="relative rounded-[28px] border border-line bg-surface p-5 shadow-sm sm:p-7">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <p className="text-xs font-semibold text-muted">YOUR DAY, IN ONE PLACE</p>
                <p className="mt-1 text-lg font-semibold tracking-tight text-ink">Good morning, Annapurna</p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-peach text-sm font-extrabold text-accent">R</span>
            </div>
            <div className="mt-5 rounded-[16px] bg-bg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted">Today&apos;s kitchen count</p>
                  <p className="mt-1 text-4xl font-semibold tracking-tight text-ink tabular-nums">42</p>
                  <p className="mt-1 text-xs text-muted">meals confirmed</p>
                </div>
                <TiffinDabbaIllustration className="h-20 w-20" />
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-line">
                <div className="h-full w-[78%] rounded-full bg-good" />
              </div>
              <p className="mt-2 text-xs text-muted">31 regular · 11 Jain</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-[12px] border border-line p-3">
                <span className="text-xs text-muted">Delivery run</span>
                <p className="mt-1 text-sm font-semibold text-ink">18 stops left</p>
                <div className="mt-2 flex items-center gap-2 text-xs font-medium text-good"><span className="h-2 w-2 rounded-full bg-good" /> Route ready</div>
              </div>
              <div className="rounded-[12px] border border-line p-3">
                <span className="text-xs text-muted">Household khata</span>
                <p className="mt-1 text-sm font-semibold text-ink">All itemised</p>
                <div className="mt-2 flex items-center gap-2 text-xs font-medium text-accent"><span aria-hidden="true">↗</span> UPI bill link</div>
              </div>
            </div>
            <p className="mt-4 text-center text-[11px] text-muted">A calmer morning starts with a clearer plan.</p>
          </div>
          <div aria-hidden="true" className="absolute -bottom-7 -left-6 hidden rounded-[14px] border border-line bg-surface p-3 shadow-sm sm:block">
            <WaterCanIllustration className="h-12 w-12" />
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 py-9 sm:grid-cols-3 sm:gap-10 sm:px-6 sm:py-12">
          <div><p className="text-sm font-semibold text-ink">Built around real routines</p><p className="mt-1 text-sm leading-6 text-muted">Designed for cutoffs, doorstep deliveries and monthly accounts.</p></div>
          <div><p className="text-sm font-semibold text-ink">Your business stays yours</p><p className="mt-1 text-sm leading-6 text-muted">You set your product, deposit and subscription prices.</p></div>
          <div><p className="text-sm font-semibold text-ink">Simple from the first tap</p><p className="mt-1 text-sm leading-6 text-muted">A browser link for households, with no separate app to install.</p></div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Why we exist</p>
          <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">The everyday economy runs on people. It should not run on chaos.</h2>
          <p className="text-base leading-7 text-muted">The best local services already have what matters most: trust, consistency and relationships. We build the quiet software layer that helps them keep those promises as they grow.</p>
        </div>
        <div className="mt-12">
          {principles.map((principle) => (
            <article key={principle.number} className="grid gap-3 border-t border-line py-7 sm:grid-cols-[72px_1fr] sm:gap-6 sm:py-9">
              <p className="text-sm font-semibold text-accent tabular-nums">{principle.number}</p>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold tracking-tight text-ink">{principle.title}</h3>
                <p className="max-w-2xl text-sm leading-7 text-muted sm:text-base">{principle.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#FFF3C9]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">What we are building</p>
            <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Small, thoughtful tools. A more dependable day.</h2>
            <p className="text-sm leading-7 text-ink/80 sm:text-base">Each part of RUXS is designed around a real moment in a vendor&apos;s day — before the kitchen opens, at the doorstep, or when it is time to settle the month.</p>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2">
            {features.map((feature) => (
              <article key={feature.title} className="flex gap-4 rounded-[16px] border border-black/5 bg-white/75 p-5 sm:p-6">
                <div className={"flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-[14px] " + feature.tint}>
                  {feature.illustration}
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-ink">{feature.title}</h3>
                  <p className="text-sm leading-6 text-muted">{feature.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[18px] bg-peach">
          <KhataCheckIllustration className="h-14 w-14" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-accent">A better kind of operating system</p>
        <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-5xl">Let local businesses focus on the work they do best.</h2>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-muted sm:text-base">Bring your regular customers, set up your own catalogue, and replace a little daily uncertainty with a lot more clarity.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/app" className="inline-flex min-h-12 items-center justify-center rounded-[10px] bg-accent px-7 py-3 text-sm font-semibold text-white transition hover:opacity-90">Start with RUXS <span aria-hidden="true" className="ml-2">→</span></Link>
          <Link href="/for/water-suppliers" className="inline-flex min-h-12 items-center justify-center rounded-[10px] border border-line bg-surface px-7 py-3 text-sm font-semibold text-ink transition hover:bg-white">Explore water suppliers</Link>
        </div>
      </section>
    </div>
  );
}
