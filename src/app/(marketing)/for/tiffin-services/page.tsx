import Link from "next/link";
import { buildMetadata, breadcrumbsJsonLd } from "@/lib/seo";
import { TiffinDabbaIllustration } from "@/components/marketing/illustrations";

export const metadata = buildMetadata({
  title: "Find Tiffin & Meal Subscriptions Near You",
  description:
    "Explore neighbourhood tiffin and meal subscription services. Each kitchen sets its own menu, prices, delivery area and schedule. Merchant tools are available separately.",
  path: "/for/tiffin-services",
});

export default function ForTiffinServicesPage() {
  return (
    <div className="space-y-16 px-4 pb-12 pt-10 sm:px-6 sm:pt-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbsJsonLd([
              { name: "Home", path: "/" },
              { name: "Tiffin & Meal Services", path: "/for/tiffin-services" },
            ]),
          ]),
        }}
      />

      <section className="mx-auto grid max-w-5xl items-center gap-8 md:grid-cols-[1fr_0.75fr] md:gap-14">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-peach px-3 py-1.5 text-xs font-semibold text-ink">
            🍱 Tiffin plans for everyday life
          </div>
          <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-6xl">
            Good meals, <span className="text-accent">on your schedule.</span>
          </h1>
          <p className="max-w-xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
            Explore local tiffin kitchens and meal plans for lunch, dinner or the full month. Every kitchen has its own menu, price and delivery routine—so you can choose what works for your home.
          </p>
          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <Link href="/in/bengaluru?category=tiffin" className="inline-flex min-h-12 items-center justify-center rounded-[10px] bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90">
              Explore meal services <span aria-hidden="true" className="ml-2">→</span>
            </Link>
            <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-[10px] border border-line bg-surface px-6 py-3 text-sm font-semibold text-ink transition hover:bg-white">
              Browse all services
            </Link>
          </div>
        </div>
        <div className="flex min-h-64 items-center justify-center rounded-[24px] bg-[#FFF0E8] p-8">
          <TiffinDabbaIllustration className="h-44 w-44 sm:h-56 sm:w-56" />
        </div>
      </section>

      <section className="mx-auto max-w-5xl">
        <div className="mb-7 space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Choose your routine</p>
          <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">A plan for the way you eat.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[16px] border border-line bg-surface p-5">
            <span className="text-2xl" aria-hidden="true">☀️</span>
            <h3 className="mt-4 text-base font-semibold text-ink">Lunch plans</h3>
            <p className="mt-2 text-sm leading-6 text-muted">Find a regular midday meal for workdays, study days or home.</p>
          </article>
          <article className="rounded-[16px] border border-line bg-surface p-5">
            <span className="text-2xl" aria-hidden="true">🌙</span>
            <h3 className="mt-4 text-base font-semibold text-ink">Dinner plans</h3>
            <p className="mt-2 text-sm leading-6 text-muted">Make evenings simpler with a meal schedule that suits your household.</p>
          </article>
          <article className="rounded-[16px] border border-line bg-surface p-5">
            <span className="text-2xl" aria-hidden="true">🗓️</span>
            <h3 className="mt-4 text-base font-semibold text-ink">Monthly subscriptions</h3>
            <p className="mt-2 text-sm leading-6 text-muted">Review a kitchen's recurring plan, service days, and conditions before you commit.</p>
          </article>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-8 rounded-[20px] border border-line bg-white p-6 sm:p-9 md:grid-cols-2 md:items-center">
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">How it works</p>
          <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Choose the kitchen, then make it your routine.</h2>
          <p className="text-sm leading-7 text-muted">Explore local options, check the price and delivery schedule offered by the kitchen, and follow that merchant's ordering or subscription steps. Where customer links are enabled, you can request eligible skips or extras without another app.</p>
        </div>
        <ol className="space-y-4">
          <li className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-peach text-sm font-bold text-accent">1</span><div><p className="text-sm font-semibold text-ink">Discover local kitchens</p><p className="mt-1 text-sm text-muted">Start with your area and find available providers.</p></div></li>
          <li className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-peach text-sm font-bold text-accent">2</span><div><p className="text-sm font-semibold text-ink">Compare each kitchen's offer</p><p className="mt-1 text-sm text-muted">Prices, menus, delivery areas and plans differ by merchant.</p></div></li>
          <li className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-peach text-sm font-bold text-accent">3</span><div><p className="text-sm font-semibold text-ink">Settle into a schedule</p><p className="mt-1 text-sm text-muted">Use the ordering and self-service options that your provider supports.</p></div></li>
        </ol>
      </section>

      <section className="mx-auto max-w-5xl rounded-[20px] bg-[#FFF3C9] p-6 sm:p-9">
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">Run a tiffin kitchen?</h2>
            <p className="max-w-2xl text-sm leading-6 text-muted">There is a separate merchant workspace for subscriptions, cutoff counts, delivery runs, billing and household accounts.</p>
          </div>
          <Link href="/app" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-[10px] bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">Open merchant portal <span aria-hidden="true" className="ml-2">→</span></Link>
        </div>
      </section>
    </div>
  );
}
