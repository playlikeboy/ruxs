/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight, Check, PackageCheck, Plus } from "lucide-react";
import { buildMetadata, organizationJsonLd, faqJsonLd } from "@/lib/seo";
import { formatINR } from "@/core/money";
import { CoverArt } from "@/components/ui/cover-art";
import { AppPreview } from "@/components/marketing/app-preview";
import { NeighbourhoodScene } from "@/components/marketing/neighbourhood-scene";
import { SkipDemo } from "@/components/marketing/skip-demo";
import { StoreShelf } from "@/components/marketing/store-shelf";
import { everydayRail, faqs, kidsFacts, kidsRail } from "@/components/marketing/home-content";

export const metadata = buildMetadata({
  title: "Kids' classes, learning kits and everyday services near you",
  description:
    "One app for your neighbourhood. Book kids' classes and workshops, shop DIY, robotics and science kits from the RUXs Store, and set up tiffin, water and milk from people nearby.",
  path: "",
});

// Illustrative bill. Amounts are integer paise and the total is computed, never typed.
const exampleBill = [
  { label: "Milk, 1 L a day", qty: "30 days", paise: 30 * 6000 },
  { label: "Water, 20L can", qty: "8 cans", paise: 8 * 5000 },
  { label: "Tiffin lunch", qty: "22 lunches", paise: 22 * 9000 },
  { label: "Lunch skipped before cutoff", qty: "2 days", paise: 0 },
];
const exampleTotal = exampleBill.reduce((sum, line) => sum + line.paise, 0);

// The page's only two actions. They appear in the hero and once more at the close.
const bigButton =
  "inline-flex min-h-14 items-center justify-center gap-2 rounded-[14px] px-7 text-lg font-semibold transition-[background-color,transform] duration-150 ease-out active:scale-[0.98] motion-reduce:transform-none";
const openAppButton = `${bigButton} bg-accent text-white hover:bg-[#A63F21]`;
const applyButton = `${bigButton} bg-ink text-bg hover:bg-[#343A33]`;

const sectionHeading = "text-balance text-4xl font-bold leading-[1.05] tracking-[-0.03em] text-ink sm:text-5xl";

export default function HomePage() {
  return (
    <div className="pb-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs)) }} />

      {/* Hero: the app, standing on the street it serves */}
      <section aria-labelledby="hero-title" className="relative overflow-hidden bg-brand-butter">
        <NeighbourhoodScene
          priority
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[clamp(190px,30vw,400px)] [mask-image:linear-gradient(to_bottom,transparent,black_28%)]"
          imgClassName="h-full object-cover object-[50%_70%]"
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-28 pt-10 sm:px-6 sm:pb-36 sm:pt-14 lg:grid-cols-[1fr_auto] lg:gap-8 lg:pb-10 lg:pt-20">
          <div className="lg:pb-72 xl:pb-80">
            <h1 id="hero-title" className="text-[clamp(2.125rem,10.4vw,2.75rem)] font-bold leading-[1.02] tracking-[-0.035em] text-ink sm:text-6xl lg:text-[56px] xl:text-[68px]">
              One app for your <span className="block text-brand-deep">neighbourhood.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-ink/85 sm:text-xl">
              Kids&apos; classes and learning kits. The RUXs Store. Daily tiffin, water and milk.
            </p>
            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <Link href="/app" className={openAppButton}>
                Open App <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link href="/apply" className={applyButton}>
                Apply as business
              </Link>
            </div>
          </div>
          <AppPreview className="mx-auto lg:mx-24 lg:self-end" />
        </div>
      </section>

      {/* Kids Zone */}
      <section aria-labelledby="kids-title" className="mx-auto mt-20 grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:mt-28 lg:grid-cols-[380px_1fr] lg:gap-16">
        <div className="relative mx-auto w-full max-w-[380px]">
          <div aria-hidden="true" className="absolute inset-0 rotate-3 rounded-[24px] bg-brand-peach" />
          <img
            src="/banners/kids-act.jpg"
            alt="Illustration of a happy child with a tablet, imagining games, dinosaurs, storybooks and painting"
            width={440}
            height={440}
            loading="lazy"
            decoding="async"
            className="relative block aspect-square w-full -rotate-2 rounded-[24px] object-cover"
          />
        </div>
        <div className="min-w-0">
          <h2 id="kids-title" className={sectionHeading}>
            Dance, robots, chess, clay.
          </h2>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-ink/80">Classes, workshops and holiday camps for ages 2 to 14, from teachers near you.</p>

          <ul className="-mx-4 mt-8 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
            {kidsRail.map((item) => (
              <li key={item.label} className="w-[46%] shrink-0 snap-start sm:w-auto">
                <Link href={item.href} className="group block rounded-card">
                  <CoverArt theme={item.theme} className="aspect-[4/3] w-full rounded-card" />
                  <span className="mt-2 block text-[15px] font-semibold leading-tight text-ink group-hover:text-accent">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2">
            {kidsFacts.map((fact) => (
              <li key={fact} className="flex items-center gap-2 text-[15px] font-medium text-ink">
                <Check className="h-4 w-4 shrink-0 text-good" aria-hidden="true" />
                {fact}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* RUXs Store: the one drenched band on the page */}
      <section aria-labelledby="store-title" className="mt-20 bg-brand-deep lg:mt-28">
        <div className="mx-auto grid max-w-6xl items-end gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:py-24">
          <div>
            <h2 id="store-title" className="text-5xl font-bold leading-[1.02] tracking-[-0.035em] text-white sm:text-6xl">
              The RUXs Store.
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-brand-leaf">
              DIY kits, robotics, science kits, art supplies and puzzles. A box of something to build, every time.
            </p>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[15px] font-semibold text-white">
              <PackageCheck className="h-5 w-5 text-kids-sunny" aria-hidden="true" />
              Shipped across India by RUXs
            </p>
          </div>
          <StoreShelf />
        </div>
      </section>

      {/* Daily essentials and local services */}
      <section aria-labelledby="daily-title" className="mx-auto mt-20 max-w-6xl px-4 sm:px-6 lg:mt-28">
        <h2 id="daily-title" className={sectionHeading}>
          Tiffin, water, milk. On repeat.
        </h2>
        <p className="mt-4 max-w-lg text-lg leading-relaxed text-ink/80">Plus stores, gifts, mehndi, fitness and physio from people nearby.</p>

        <ul className="mt-8 grid grid-cols-4 gap-x-3 gap-y-5 lg:grid-cols-8 lg:gap-x-4">
          {everydayRail.map((item) => (
            <li key={item.label}>
              <Link href={item.href} className="group block rounded-card text-center">
                <CoverArt theme={item.theme} className="aspect-square w-full rounded-card" />
                <span className="mt-2 block text-[13px] font-semibold text-ink group-hover:text-accent sm:text-[15px]">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h3 className="text-2xl font-bold tracking-[-0.02em] text-ink">Skip a day in one tap.</h3>
            <p className="mb-5 mt-1.5 text-base text-muted">Try it. Change tomorrow before the store&apos;s cutoff.</p>
            <SkipDemo />
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-[-0.02em] text-ink">One bill at month end.</h3>
            <p className="mb-5 mt-1.5 text-base text-muted">Worked out from each delivery. Skipped days stay off it.</p>
            <figure className="w-full max-w-[400px] rounded-[16px] border border-line bg-surface p-5 sm:p-6">
              <figcaption className="flex items-baseline justify-between border-b border-line pb-3">
                <span className="text-lg font-semibold text-ink">October bill</span>
                <span className="text-xs font-medium text-muted">Example</span>
              </figcaption>
              <dl className="divide-y divide-line">
                {exampleBill.map((line) => (
                  <div key={line.label} className="flex items-baseline justify-between gap-4 py-3">
                    <dt className="text-[15px] text-ink">
                      {line.label}
                      <span className="block text-sm text-muted">{line.qty}</span>
                    </dt>
                    <dd className="whitespace-nowrap text-[15px] font-semibold tabular-nums text-ink">{line.paise === 0 ? "Not charged" : formatINR(line.paise)}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-1 flex items-baseline justify-between border-t-2 border-ink pt-3">
                <span className="text-base font-semibold text-ink">Total</span>
                <span className="text-2xl font-bold tabular-nums tracking-[-0.02em] text-ink">{formatINR(exampleTotal)}</span>
              </div>
            </figure>
          </div>
        </div>
      </section>

      {/* Questions */}
      <section aria-labelledby="faq-title" className="mx-auto mt-20 max-w-3xl px-4 sm:px-6 lg:mt-28">
        <h2 id="faq-title" className={sectionHeading}>
          Questions
        </h2>
        <div className="mt-8 border-t-2 border-ink">
          {faqs.map((faq) => (
            <details key={faq.question} className="group border-b border-line">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-[17px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {faq.question}
                <Plus className="h-5 w-5 shrink-0 text-accent transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none" aria-hidden="true" />
              </summary>
              <p className="pb-5 text-base leading-relaxed text-ink/80">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Close: the same two doors as the hero */}
      <section aria-label="Get started" className="mx-auto mt-20 grid max-w-6xl gap-4 px-4 sm:px-6 md:grid-cols-2 lg:mt-28">
        <div className="flex flex-col items-start justify-between gap-8 rounded-[24px] bg-brand-peach p-7 sm:p-10">
          <div>
            <h2 className="text-balance text-3xl font-bold leading-[1.08] tracking-[-0.03em] text-ink sm:text-4xl">See who serves your street.</h2>
            <p className="mt-3 text-base leading-relaxed text-ink/80">Runs in your browser. Nothing to download.</p>
          </div>
          <Link href="/app" className={openAppButton}>
            Open App <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
        <div className="flex flex-col items-start justify-between gap-8 rounded-[24px] bg-brand-leaf p-7 sm:p-10">
          <div>
            <h2 className="text-balance text-3xl font-bold leading-[1.08] tracking-[-0.03em] text-ink sm:text-4xl">Run a class, kitchen or shop?</h2>
            <p className="mt-3 text-base leading-relaxed text-ink/80">Orders, bookings, a delivery run sheet and monthly bills in one panel.</p>
          </div>
          <Link href="/apply" className={applyButton}>
            Apply as business
          </Link>
        </div>
      </section>
    </div>
  );
}
