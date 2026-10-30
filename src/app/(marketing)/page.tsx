import Link from "next/link";
import { NeighbourhoodScene } from "@/components/marketing/neighbourhood-scene";
import { ArrowRight, ArrowUpRight, Check, Mail, MessageCircle, Plus } from "lucide-react";
import { buildMetadata, organizationJsonLd, faqJsonLd } from "@/lib/seo";
import { formatINR } from "@/core/money";
import { DayRibbon } from "@/components/marketing/day-ribbon";
import { SkipDemo } from "@/components/marketing/skip-demo";
import { everyday, family, faqs, merchantTools } from "@/components/marketing/home-content";

export const metadata = buildMetadata({
  title: "Tiffin, water, milk and kids' classes from your neighbourhood",
  description:
    "Order daily essentials and book family services from people nearby. Skip any day before the cutoff and pay on delivery or on one monthly bill.",
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

const kidsTopics = ["Dance", "Art and craft", "Tutors", "STEM and robotics", "Chess", "Holiday camps"];

const primaryButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-[12px] bg-accent px-6 text-base font-semibold text-white transition-colors duration-150 hover:bg-[#A53F22]";

const inkButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-[12px] bg-ink px-6 text-base font-semibold text-bg transition-colors duration-150 hover:bg-[#383D36]";

function DirectoryList({ title, items }: { title: string; items: { name: string; detail: string; href: string }[] }) {
  return (
    <div>
      <h3 className="border-b-2 border-ink pb-3 text-xl font-semibold text-ink">{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item.name} className="border-b border-line">
            <Link href={item.href} className="group flex items-center justify-between gap-4 py-4">
              <span>
                <span className="block text-[17px] font-semibold text-ink group-hover:text-accent">{item.name}</span>
                <span className="mt-0.5 block text-sm text-muted">{item.detail}</span>
              </span>
              <ArrowUpRight className="h-5 w-5 shrink-0 text-muted transition-colors group-hover:text-accent" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs)) }} />

      {/* A day at home: the headline over one timetable of the household day */}
      <section aria-labelledby="hero-title">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 sm:pt-16 lg:pb-14 lg:pt-20">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-semibold text-ink shadow-2xs sm:mb-6 sm:text-sm">
            <span className="inline-block h-2 w-2 rounded-full bg-brand-coral" aria-hidden="true" />
            <span className="font-bold tracking-tight text-ink">
              RU<span className="text-brand-coral font-extrabold">X</span>s
            </span>
            <span className="text-muted/60" aria-hidden="true">·</span>
            <span className="font-medium text-muted">
              Recurring Utility e<span className="font-bold text-brand-coral">X</span>perience
            </span>
          </div>
          <h1 id="hero-title" className="text-[44px] font-bold leading-[1.02] tracking-[-0.035em] text-ink sm:text-6xl lg:text-[72px]">
            <span className="block text-balance">Your home runs on a routine.</span>
            <span className="block text-balance text-brand-deep">Run it from one place.</span>
          </h1>
          <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-16">
            <p className="max-w-xl text-lg leading-relaxed text-[#4A463F]">
              Daily tiffin meals, 20L water cans, fresh dairy, and verified kids&apos; classes — from dance, robotics and chess to pottery — from trusted people in your neighbourhood.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <Link href="/app" className={primaryButton}>
                Find services near you <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/app/kids"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[12px] border border-line bg-surface px-5 text-base font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
              >
                Kids Zone &amp; Classes 🎨
              </Link>
              <Link href="/apply" className="text-base font-semibold text-ink underline decoration-line decoration-2 underline-offset-4 hover:decoration-accent sm:ml-2">
                I run a business
              </Link>
            </div>
          </div>

          {/* Quick service discovery chips */}
          <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-line/60 pt-4">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-muted">Explore:</span>
            {[
              { label: "🍱 Tiffin meals", href: "/app/category/tiffin" },
              { label: "💧 20L Water cans", href: "/app/category/water" },
              { label: "🥛 Fresh milk", href: "/app/category/milk" },
              { label: "💃 Dance classes", href: "/app/kids" },
              { label: "🤖 Robotics & STEM", href: "/app/kids" },
              { label: "♟️ Chess coaching", href: "/app/kids" },
              { label: "🎨 Art & Pottery", href: "/app/kids" },
              { label: "📦 DIY activity kits", href: "/app/kids/kits" },
            ].map((chip) => (
              <Link
                key={chip.label}
                href={chip.href}
                className="inline-flex items-center rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink transition hover:border-accent hover:text-accent"
              >
                {chip.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="border-y border-[#CFE3CB] bg-brand-leaf">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-12">
            <h2 className="sr-only">A day with RUXs</h2>
            <DayRibbon />
          </div>
        </div>
        <p className="mx-auto max-w-6xl px-4 pt-4 text-sm text-muted sm:px-6">
          Meals, water, and dairy with simple daily skips — plus verified kids&apos; classes you can book and pay per session.
        </p>
      </section>

      {/* The mechanism only RUXs has: change tomorrow before the cutoff */}
      <section aria-labelledby="skip-title" className="mx-auto mt-24 grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:mt-32 lg:grid-cols-[1fr_400px] lg:gap-20">
        <div className="max-w-xl">
          <h2 id="skip-title" className="text-balance text-4xl font-bold leading-[1.08] tracking-[-0.03em] text-ink sm:text-5xl">
            Change any day before the cutoff.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-[#4A463F]">
            Every store sets a daily cutoff, like 10:00 AM for lunch. Before it, skip a day, add an extra or pause your plan. After it, the kitchen is already cooking.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-[#4A463F]">
            Stores can also send your home a private link, so anyone in the family can tap Deliver or Skip without signing in.
          </p>
        </div>
        <SkipDemo />
      </section>

      {/* Everything RUXs carries, as a directory rather than a card grid */}
      <section aria-labelledby="services-title" className="mx-auto mt-24 max-w-6xl px-4 sm:px-6 lg:mt-32">
        <h2 id="services-title" className="max-w-2xl text-balance text-4xl font-bold leading-[1.08] tracking-[-0.03em] text-ink sm:text-5xl">
          Daily essentials and family services, close by.
        </h2>
        <div className="mt-10 grid gap-10 md:grid-cols-2 md:gap-14">
          <DirectoryList title="Every day" items={everyday} />
          <DirectoryList title="For the family" items={family} />
        </div>
        <p className="mt-6 text-sm text-muted">What you see depends on who delivers to your area. Each store sets its own prices.</p>
      </section>

      {/* Kids Zone & Activities */}
      <section aria-labelledby="kids-title" className="mx-auto mt-24 max-w-6xl px-4 sm:px-6 lg:mt-32">
        <div className="rounded-[24px] border border-line bg-surface p-6 shadow-xs sm:p-10 lg:p-12">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#CFE3CB] bg-brand-leaf px-3.5 py-1 text-xs font-bold text-brand-deep">
              <span>🎨</span>
              <span>RUXs Kids Zone</span>
              <span className="text-brand-deep/40">•</span>
              <span>Classes, Camps &amp; DIY Kits</span>
            </div>
            <Link
              href="/app/kids"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
            >
              Open Kids Zone <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
            <div>
              <h2 id="kids-title" className="text-balance text-3xl font-bold leading-[1.1] tracking-[-0.03em] text-ink sm:text-4xl lg:text-5xl">
                Dance, robotics, chess, pottery and camps for your child.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#4A463F] sm:text-lg">
                Discover verified neighbourhood dance academies, STEM labs, art studios, and music teachers. Whether it&apos;s an evening hip-hop or Kathak class, weekly robotics workshop, pottery wheel session, chess coaching, or holiday camp — explore and book directly.
              </p>

              {/* Age brackets */}
              <div className="mt-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">Curated by Age Group</span>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {[
                    { label: "Toddlers (2–4 yrs)", emoji: "🧸" },
                    { label: "Early Years (4–7 yrs)", emoji: "🎨" },
                    { label: "Young Explorers (7–10 yrs)", emoji: "🚀" },
                    { label: "Pre-Teens (10–14+ yrs)", emoji: "💡" },
                  ].map((bracket) => (
                    <span
                      key={bracket.label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-[#FAFAF7] px-3.5 py-1 text-xs font-medium text-ink"
                    >
                      <span>{bracket.emoji}</span>
                      <span>{bracket.label}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-line bg-[#FAFAF7] p-5 sm:p-6">
              <ul className="space-y-3.5">
                {[
                  "Verified teachers & academies: background checked and reviewed by RUXs before listing.",
                  "Request your preferred time slot: the teacher confirms availability with instant booking updates.",
                  "Pay per session: cash or direct UPI at the studio, home, or academy.",
                  "Activity passes & holiday camps: multi-session packs and weekend creative camps.",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm leading-relaxed text-ink sm:text-base">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-good" aria-hidden="true" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-4">
                <Link
                  href="/app/kids"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ink px-5 text-sm font-semibold text-bg transition hover:bg-[#383D36]"
                >
                  Browse all classes <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/app/kids/kits"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent"
                >
                  DIY activity kits
                </Link>
              </div>
            </div>
          </div>

          {/* Cards for key activities */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Dance & Performing Arts",
                desc: "Kathak, Bharatnatyam, Western Hip-Hop, Contemporary & Bollywood dance classes with trained instructors.",
                tag: "Studio or Home",
                badge: "💃 Dance",
                href: "/app/kids",
              },
              {
                title: "Robotics, STEM & Coding",
                desc: "Build working robots, code Scratch & Python games, and explore hands-on science experiments.",
                tag: "Labs & Online",
                badge: "🤖 STEM",
                href: "/app/kids",
              },
              {
                title: "Art, Pottery & Craft",
                desc: "Pottery wheel workshops, clay modeling, acrylic painting, sketching and handmade craft courses.",
                tag: "Workshops",
                badge: "🎨 Creative",
                href: "/app/kids",
              },
              {
                title: "Chess Academy & Logic",
                desc: "From beginner moves to tournament strategies, plus abacus, Olympiad math and mental logic.",
                tag: "Coaching",
                badge: "♟️ Chess",
                href: "/app/kids",
              },
              {
                title: "Music & Vocal Lessons",
                desc: "Guitar, keyboard, Hindustani classical vocals, Western singing, and rhythm fundamentals.",
                tag: "Academy",
                badge: "🎵 Music",
                href: "/app/kids",
              },
              {
                title: "Holiday Camps & DIY Kits",
                desc: "Action-packed holiday camps, science experiment kits and craft materials delivered home.",
                tag: "Camps & Kits",
                badge: "⛺ Camps",
                href: "/app/kids/kits",
              },
            ].map((activity) => (
              <Link
                key={activity.title}
                href={activity.href}
                className="group flex flex-col justify-between rounded-xl border border-line bg-[#FFFDF8] p-4 transition-all hover:border-accent hover:shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-line bg-surface px-2.5 py-0.5 text-xs font-semibold text-ink">
                      {activity.badge}
                    </span>
                    <span className="text-xs font-medium text-muted">{activity.tag}</span>
                  </div>
                  <h3 className="mt-3 text-base font-bold text-ink transition-colors group-hover:text-accent">
                    {activity.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#5A564F]">{activity.desc}</p>
                </div>
                <div className="mt-4 flex items-center justify-end text-xs font-semibold text-accent group-hover:underline">
                  <span>Explore classes</span>
                  <ArrowUpRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* One monthly bill */}
      <section id="monthly-bill" aria-labelledby="bill-title" className="mx-auto mt-24 grid max-w-6xl scroll-mt-24 items-center gap-12 px-4 sm:px-6 lg:mt-32 lg:grid-cols-[400px_1fr] lg:gap-20">
        <figure className="order-2 w-full max-w-[400px] rounded-[16px] border border-line bg-surface p-5 sm:p-6 lg:order-1">
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
        <div className="order-1 max-w-xl lg:order-2">
          <h2 id="bill-title" className="text-balance text-4xl font-bold leading-[1.08] tracking-[-0.03em] text-ink sm:text-5xl">
            One bill at the end of the month.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-[#4A463F]">
            Every delivery is recorded as it happens, and your bill is worked out from those records. Skipped days stay off it. Pay online or in cash to the store.
          </p>
          <p className="mt-4 text-base text-muted">
            No commission on pay-on-delivery or monthly-bill orders. Online payments may carry a small fee, shown before you pay.
          </p>
        </div>
      </section>

      {/* The neighbourhood, and the people who run it */}
      <section aria-labelledby="merchant-title" className="mx-auto mt-24 max-w-6xl px-4 sm:px-6 lg:mt-32">
        <NeighbourhoodScene className="h-auto w-full rounded-[24px]" />
        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-20">
          <h2 id="merchant-title" className="text-balance text-4xl font-bold leading-[1.08] tracking-[-0.03em] text-ink sm:text-5xl">
            Run by people in your neighbourhood.
          </h2>
          <div>
            <p className="text-lg leading-relaxed text-[#4A463F]">
              Run a home kitchen, water depot, dairy, shop or class? RUXs gives you the tools to serve the homes around you.
            </p>
            <ul className="mt-5 space-y-3">
              {merchantTools.map((tool) => (
                <li key={tool} className="flex gap-3 text-base text-ink">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-good" aria-hidden="true" />
                  {tool}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link href="/apply" className={inkButton}>
                List your business <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/merchant-panel/sign-in" className="text-base font-semibold text-ink underline decoration-line decoration-2 underline-offset-4 hover:decoration-accent">
                Merchant sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Questions */}
      <section aria-labelledby="faq-title" className="mx-auto mt-24 max-w-3xl px-4 sm:px-6 lg:mt-32">
        <h2 id="faq-title" className="text-4xl font-bold tracking-[-0.03em] text-ink sm:text-5xl">Questions</h2>
        <div className="mt-8 border-t-2 border-ink">
          {faqs.map((faq) => (
            <details key={faq.question} className="group border-b border-line">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-[17px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {faq.question}
                <Plus className="h-5 w-5 shrink-0 text-accent transition-transform duration-200 group-open:rotate-45" aria-hidden="true" />
              </summary>
              <p className="pb-5 text-base leading-relaxed text-[#4A463F]">{faq.answer}</p>
            </details>
          ))}
        </div>

        {/* Support & Contact Card */}
        <div className="mt-12 rounded-[20px] border border-line bg-surface p-6 shadow-xs sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-peach bg-peach/60 px-3 py-1 text-xs font-semibold text-accent">
                Customer &amp; Merchant Support
              </span>
              <h3 className="mt-2 text-xl font-bold tracking-tight text-ink sm:text-2xl">
                Need help or have questions?
              </h3>
              <p className="mt-1 text-sm text-muted">
                Reach out for support with daily deliveries, kids&apos; classes, billing, or listing your business.
              </p>
            </div>
            <div className="flex flex-col gap-2.5 sm:shrink-0">
              <a
                href="mailto:adminruxs@gmail.com"
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-[#FAFAF7] px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent"
              >
                <Mail className="h-4 w-4 text-accent" aria-hidden="true" />
                <span>adminruxs@gmail.com</span>
              </a>
              <a
                href="https://wa.me/919610201507"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-good/20 bg-good/10 px-4 py-2.5 text-sm font-semibold text-good transition hover:bg-good/15"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                <span>9610201507 <span className="text-xs font-normal text-muted">(Contact Only on WhatsApp)</span></span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Close */}
      <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6 lg:mt-32">
        <div className="flex flex-col gap-6 border-t-2 border-ink pt-10 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-xl text-balance text-3xl font-bold leading-[1.1] tracking-[-0.03em] text-ink sm:text-4xl">
            See who delivers to your street.
          </p>
          <Link href="/app" className={primaryButton}>
            Find services near you <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
