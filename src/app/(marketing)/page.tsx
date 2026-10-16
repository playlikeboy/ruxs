import Link from "next/link";
import {
  buildMetadata,
  organizationJsonLd,
  faqJsonLd,
} from "@/lib/seo";
import {
  TiffinDabbaIllustration,
  WaterCanIllustration,
  ScooterIllustration,
  KhataCheckIllustration,
} from "@/components/marketing/illustrations";

export const metadata = buildMetadata({
  title: "Order Tiffins, Water Cans & Everyday Essentials",
  description:
    "Find neighbourhood tiffin services and 20L water-can delivery, compare each merchant's own prices, and build a routine that works for your home. Merchant portal available too.",
  path: "",
});

const faqs = [
  {
    question: "What can I order through RUXs?",
    answer:
      "RUXs is built for recurring local essentials such as tiffin and meal plans, 20-litre water cans, and other neighbourhood household services as they become available in your area.",
  },
  {
    question: "Do all merchants charge the same price?",
    answer:
      "No. Every merchant manages their own catalogue, prices, delivery terms, and subscription plans. Check the details offered by each local business before ordering.",
  },
  {
    question: "Can I subscribe instead of ordering every day?",
    answer:
      "RUXs is designed around recurring services. Subscription options and delivery schedules depend on the merchant and the service available in your area.",
  },
  {
    question: "Are you a merchant?",
    answer:
      "RUXs also provides a separate merchant workspace for tiffin kitchens and water suppliers to manage recurring customers, daily deliveries, billing, and returnable containers.",
  },
];

const categories = [
  {
    title: "Tiffin & daily meals",
    subtitle: "Find a dependable everyday meal",
    detail: "Lunch plans · Dinner plans · Monthly tiffins",
    href: "/for/tiffin-services",
    tint: "bg-[#FFF0E8]",
    illustration: <TiffinDabbaIllustration className="h-24 w-24 sm:h-28 sm:w-28" />,
    tag: "MEALS",
  },
  {
    title: "20L water cans",
    subtitle: "Keep clean water coming home",
    detail: "Water-can delivery · Repeat orders · Can returns",
    href: "/for/water-suppliers",
    tint: "bg-[#E7F2FC]",
    illustration: <WaterCanIllustration className="h-24 w-24 sm:h-28 sm:w-28" />,
    tag: "WATER",
  },
  {
    title: "Everyday essentials",
    subtitle: "Local services for your daily routine",
    detail: "Discover neighbourhood options as they launch",
    href: "/app",
    tint: "bg-[#E8F5EB]",
    illustration: <KhataCheckIllustration className="h-24 w-24 sm:h-28 sm:w-28" />,
    tag: "LOCAL",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-20 pb-10 sm:space-y-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            organizationJsonLd(),
            faqJsonLd(faqs),
          ]),
        }}
      />

      <section className="relative overflow-hidden border-b border-line bg-[#FFF8F2]">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-[#FFE3D2]/70 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-[#E1F3E7]/70 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 md:grid-cols-[1.05fr_0.95fr] md:gap-14 lg:py-24">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#F2D4C4] bg-white/80 px-3 py-1.5 text-xs font-semibold text-ink">
              <span className="h-2 w-2 rounded-full bg-good" />
              Everyday essentials, from your neighbourhood
            </div>
            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl">
              Your daily needs.
              <br />
              <span className="text-accent">Delivered simply.</span>
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
              Find tiffin subscriptions, daily meals and 20L water-can delivery from local businesses. Choose the service that fits your home and let the routine take care of itself.
            </p>

            <div className="flex max-w-xl flex-col gap-3 sm:flex-row">
              <Link href="/for/tiffin-services" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[11px] bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98]">
                Explore meal plans <span aria-hidden="true">→</span>
              </Link>
              <Link href="/for/water-suppliers" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[11px] border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-bg active:scale-[0.98]">
                Find water delivery
              </Link>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1 text-xs font-medium text-muted">
              <span><span className="mr-1 text-good">✓</span>Local businesses</span>
              <span><span className="mr-1 text-good">✓</span>Merchant-set prices</span>
              <span><span className="mr-1 text-good">✓</span>Built for subscriptions</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div aria-hidden="true" className="absolute inset-5 rotate-3 rounded-[30px] bg-[#F6D9C8]" />
            <div className="relative rounded-[24px] border border-line bg-white p-4 shadow-[0_24px_70px_-35px_rgba(62,38,24,0.35)] sm:p-6">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div>
                  <p className="text-xs font-semibold text-muted">YOUR EVERYDAY LIST</p>
                  <p className="mt-1 text-lg font-semibold tracking-tight text-ink">Good morning ☀️</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-peach text-lg font-extrabold text-accent">R</span>
              </div>
              <div className="mt-4 rounded-[16px] bg-[#FAFAF7] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">Your daily essentials</p>
                    <p className="text-lg font-semibold text-ink">One less thing to remember.</p>
                    <p className="text-sm leading-5 text-muted">Simple routines, from people nearby.</p>
                  </div>
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[16px] bg-[#E3F2E8]">
                    <WaterCanIllustration className="h-16 w-16" />
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-[14px] border border-line p-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#FFF0E8]">
                    <TiffinDabbaIllustration className="h-10 w-10" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-ink">Tiffin plans</p>
                  <p className="mt-1 text-xs leading-5 text-muted">Meals that fit your day</p>
                </div>
                <div className="rounded-[14px] border border-line p-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#E7F2FC]">
                    <WaterCanIllustration className="h-10 w-10" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-ink">Water cans</p>
                  <p className="mt-1 text-xs leading-5 text-muted">Replenish without fuss</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 rounded-[13px] border border-dashed border-line p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-mint">
                  <KhataCheckIllustration className="h-9 w-9" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">Your routine, your way</p>
                  <p className="text-xs text-muted">Plans and prices vary by local merchant.</p>
                </div>
                <span className="text-accent" aria-hidden="true">↗</span>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-4 hidden rounded-[12px] border border-line bg-white p-3 shadow-sm sm:block">
              <ScooterIllustration className="h-10 w-14" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Browse services</p>
            <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">What do you need today?</h2>
            <p className="max-w-2xl text-sm leading-6 text-muted sm:text-base">Start with the essentials most homes order again and again.</p>
          </div>
          <Link href="/app" className="text-sm font-semibold text-accent hover:underline">Explore local services <span aria-hidden="true">→</span></Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {categories.map((category) => (
            <Link key={category.title} href={category.href} className="group overflow-hidden rounded-[18px] border border-line bg-white transition duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
              <div className={`flex min-h-44 items-center justify-between px-6 py-4 ${category.tint}`}>
                <div className="max-w-[190px] space-y-2">
                  <span className="inline-flex rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-ink">{category.tag}</span>
                  <h3 className="text-xl font-semibold tracking-tight text-ink">{category.title}</h3>
                </div>
                <div className="transition duration-200 group-hover:scale-105">{category.illustration}</div>
              </div>
              <div className="space-y-2 p-5">
                <p className="text-sm font-semibold text-ink">{category.subtitle}</p>
                <p className="text-xs leading-5 text-muted">{category.detail}</p>
                <span className="inline-flex items-center gap-2 pt-2 text-sm font-semibold text-accent">Explore category <span aria-hidden="true" className="transition group-hover:translate-x-1">→</span></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 sm:py-16 md:grid-cols-[0.8fr_1.2fr] md:items-center">
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">How RUXs works</p>
            <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">A smoother way to manage everyday deliveries.</h2>
            <p className="text-sm leading-7 text-muted sm:text-base">Choose a local service, review that merchant&apos;s terms and schedule, then use their ordering or subscription flow. Your price belongs to the merchant you choose—not a one-size-fits-all price list.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-[15px] border border-line bg-bg p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-peach text-sm font-bold text-accent">1</span>
              <h3 className="mt-4 text-sm font-semibold text-ink">Find your service</h3>
              <p className="mt-2 text-xs leading-5 text-muted">Explore tiffins and water-can delivery options for your neighbourhood.</p>
            </article>
            <article className="rounded-[15px] border border-line bg-bg p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-sky text-sm font-bold text-ink">2</span>
              <h3 className="mt-4 text-sm font-semibold text-ink">Pick a routine</h3>
              <p className="mt-2 text-xs leading-5 text-muted">Review each merchant&apos;s own plans, rates and delivery schedule.</p>
            </article>
            <article className="rounded-[15px] border border-line bg-bg p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-mint text-sm font-bold text-ink">3</span>
              <h3 className="mt-4 text-sm font-semibold text-ink">Stay in control</h3>
              <p className="mt-2 text-xs leading-5 text-muted">Where supported, manage skips, extras and upcoming delivery days from your customer link.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-[1fr_0.9fr] md:items-center">
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Built for real neighbourhoods</p>
          <h2 className="max-w-xl text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Good service should feel personal. Ordering it should feel easy.</h2>
          <p className="max-w-xl text-sm leading-7 text-muted sm:text-base">RUXs brings local customers and independent merchants closer together for the everyday products people rely on. Availability will grow neighbourhood by neighbourhood.</p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link href="/app" className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">Explore nearby services <span className="ml-2" aria-hidden="true">→</span></Link>
            <Link href="/about" className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:bg-bg">Our story</Link>
          </div>
        </div>
        <div className="rounded-[20px] bg-[#FFF3C9] p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[15px] bg-white">
              <KhataCheckIllustration className="h-12 w-12" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-ink">Are you a local merchant?</h3>
              <p className="text-sm leading-6 text-muted">Manage your subscriptions, daily delivery runs, customer balances and billing from a dedicated workspace built for your business.</p>
              <Link href="/merchant-panel" className="inline-flex items-center gap-2 pt-2 text-sm font-semibold text-accent hover:underline">Open merchant portal <span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-7 space-y-2 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">A few common questions</h2>
          <p className="text-sm text-muted">What to know before you get started.</p>
        </div>
        <div className="divide-y divide-line overflow-hidden rounded-[14px] border border-line bg-white">
          {faqs.map((faq) => (
            <div key={faq.question} className="space-y-2 p-5">
              <h3 className="text-sm font-semibold text-ink">{faq.question}</h3>
              <p className="text-sm leading-6 text-muted">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[18px] bg-peach">
          <TiffinDabbaIllustration className="h-14 w-14" />
        </div>
        <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Make the everyday a little easier.</h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted sm:text-base">Find your local essentials, discover a routine you love, and spend less time coordinating the things that keep a home running.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/app" className="inline-flex min-h-12 items-center justify-center rounded-[10px] bg-accent px-7 py-3 text-sm font-semibold text-white transition hover:opacity-90">Explore local services <span aria-hidden="true" className="ml-2">→</span></Link>
          <Link href="/merchant-panel" className="inline-flex min-h-12 items-center justify-center rounded-[10px] border border-line bg-white px-7 py-3 text-sm font-semibold text-ink transition hover:bg-bg">Merchant portal</Link>
        </div>
      </section>
    </div>
  );
}
