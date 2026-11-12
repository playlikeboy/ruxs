import { UiIcon } from "@/components/ui/app-icon";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import {
  breadcrumbsJsonLd,
  buildMetadata,
  organizationJsonLd,
} from "@/lib/seo";
import {
  KhataCheckIllustration,
  ScooterIllustration,
  TiffinDabbaIllustration,
  WaterCanIllustration,
} from "@/components/marketing/illustrations";

export const metadata = buildMetadata({
  title: "About RUXs — Everyday Essentials From Your Neighbourhood",
  description:
    "RUXs helps households discover everyday local services such as tiffin subscriptions and 20L water-can delivery, while giving independent merchants their own operations portal.",
  path: "/about",
});

const principles = [
  {
    title: "Everyday essentials should be easy to find",
    body: "From a regular lunch dabba to the next water can, household essentials are often delivered by neighbourhood businesses people already trust. RUXs is building a simpler way to discover those services and choose the routine that fits your home.",
  },
  {
    title: "Local businesses keep their independence",
    body: "Each merchant manages their own catalogue, prices, delivery schedule and subscription terms. RUXs is not a one-price-fits-all catalogue: the offer and price are set by the business you choose.",
  },
  {
    title: "Customers and merchants both deserve better tools",
    body: "Customers need a clear way to understand their service and manage day-to-day changes. Merchants need dependable tools for recurring orders, delivery runs, customer balances, returnable containers and billing. RUXs brings those parts together without making the two experiences compete.",
  },
];

const features = [
  {
    title: "Tiffin and meal subscriptions",
    text: "Explore recurring meal routines from neighbourhood kitchens, with merchant-specific plans and prices.",
    illustration: <TiffinDabbaIllustration className="h-14 w-14" />,
    tint: "bg-peach",
  },
  {
    title: "20L water-can delivery",
    text: "Find a local supplier for a household staple and make repeat delivery part of your routine.",
    illustration: <WaterCanIllustration className="h-14 w-14" />,
    tint: "bg-sky",
  },
  {
    title: "Clear customer self-service",
    text: "Where supported by your merchant, use a private link to review your schedule, request changes and see billing.",
    illustration: <KhataCheckIllustration className="h-14 w-14" />,
    tint: "bg-mint",
  },
  {
    title: "A dedicated merchant workspace",
    text: "Independent service businesses can manage subscriptions, daily delivery operations and household accounts in one place.",
    illustration: <ScooterIllustration className="h-16 w-20" />,
    tint: "bg-butter",
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
            breadcrumbsJsonLd([
              { name: "Home", path: "/" },
              { name: "About RUXs", path: "/about" },
            ]),
          ]),
        }}
      />

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-20 md:grid-cols-[1.08fr_0.92fr] md:gap-14">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-peach px-3 py-1.5 text-xs font-semibold text-ink">
            <span className="h-2 w-2 rounded-full bg-good" aria-hidden="true" />
            Made for the neighbourhood
          </span>
          <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-6xl">
            Everyday life, <span className="text-accent">made a little easier.</span>
          </h1>
          <p className="max-w-xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
            RUXs helps you discover recurring essentials such as tiffin subscriptions and 20L water-can delivery from local businesses. Behind the scenes, those businesses get a dedicated workspace to keep their daily service running smoothly.
          </p>
          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <ButtonLink href="/app" size="lg" className="px-6">
              Find services near me <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/merchant-panel" variant="secondary" size="lg" className="px-6">
              Merchant portal
            </ButtonLink>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2 text-xs font-medium text-muted">
            <span className="inline-flex items-center gap-2"><UiIcon name="check" className="h-4 w-4 text-accent" /> Merchant-set prices</span>
            <span className="inline-flex items-center gap-2"><UiIcon name="check" className="h-4 w-4 text-accent" /> Recurring services</span>
            <span className="inline-flex items-center gap-2"><UiIcon name="check" className="h-4 w-4 text-accent" /> Local businesses</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div aria-hidden="true" className="absolute inset-5 rotate-3 rounded-[36px] bg-peach" />
          <div className="relative rounded-[28px] border border-line bg-surface p-5 shadow-sm sm:p-7">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <p className="text-xs font-semibold text-muted">THE EVERYDAY LIST</p>
                <p className="mt-1 text-lg font-semibold tracking-tight text-ink">Good morning <UiIcon name="sun" /></p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-peach text-sm font-extrabold text-accent">R</span>
            </div>
            <div className="mt-5 flex items-center gap-4 rounded-[16px] bg-bg p-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[14px] bg-brand-peach"><TiffinDabbaIllustration className="h-14 w-14" /></div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-ink">A meal plan for your week</p>
                <p className="text-xs leading-5 text-muted">Choose the kitchen, plan and price that work for you.</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4 rounded-[16px] bg-bg p-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[14px] bg-sky"><WaterCanIllustration className="h-14 w-14" /></div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-ink">Water when you need it</p>
                <p className="text-xs leading-5 text-muted">Build a dependable delivery routine with a local supplier.</p>
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-muted">Local services, with their own terms and prices.</p>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-9 sm:grid-cols-3 sm:gap-10 sm:px-6 sm:py-12">
          <div><p className="text-sm font-semibold text-ink">For households</p><p className="mt-1 text-sm leading-6 text-muted">Find everyday services and subscription options from local merchants.</p></div>
          <div><p className="text-sm font-semibold text-ink">For independent merchants</p><p className="mt-1 text-sm leading-6 text-muted">Operate your business with your own catalogue, customers and delivery routines.</p></div>
          <div><p className="text-sm font-semibold text-ink">Prices stay local</p><p className="mt-1 text-sm leading-6 text-muted">Each business sets its own rates, service areas and subscription terms.</p></div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Bring convenience home without losing the local touch.</h2>
          <p className="text-base leading-7 text-muted">We believe finding a dependable daily service should feel simple, and running a small service business should not mean drowning in messages, ledgers and spreadsheets.</p>
        </div>
        <div className="mt-12">
          {principles.map((principle) => (
            <article key={principle.title} className="border-t border-line py-7 sm:py-9">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold tracking-tight text-ink">{principle.title}</h3>
                <p className="max-w-2xl text-sm leading-7 text-muted sm:text-base">{principle.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-butter">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Little routines that make a big difference.</h2>
            <p className="text-sm leading-7 text-ink/80 sm:text-base">Start with the essentials people order on repeat, then discover more neighbourhood services as coverage grows.</p>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2">
            {features.map((feature) => (
              <article key={feature.title} className="flex gap-4 rounded-card border border-line bg-surface p-5 sm:p-6">
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
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[18px] bg-peach"><TiffinDabbaIllustration className="h-14 w-14" /></div>
        <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-5xl">Your next great local routine starts here.</h2>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-muted sm:text-base">Explore local services for your home—or open the merchant portal if you run a neighbourhood business.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/app" size="lg" className="px-7">
            Find services near me <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </ButtonLink>
          <ButtonLink href="/merchant-panel" variant="secondary" size="lg" className="px-7">
            Open merchant portal
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
