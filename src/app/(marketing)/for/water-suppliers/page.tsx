import Link from "next/link";
import { buildMetadata, breadcrumbsJsonLd } from "@/lib/seo";
import { WaterCanIllustration } from "@/components/marketing/illustrations";

export const metadata = buildMetadata({
  title: "Find 20L Water-Can Delivery Near You",
  description:
    "Explore neighbourhood 20L water-can delivery services and choose a supplier based on their own prices, delivery schedule and service area. Merchant operations tools available separately.",
  path: "/for/water-suppliers",
});

export default function ForWaterSuppliersPage() {
  return (
    <div className="space-y-16 px-4 pb-12 pt-10 sm:px-6 sm:pt-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbsJsonLd([
              { name: "Home", path: "/" },
              { name: "Water-Can Delivery", path: "/for/water-suppliers" },
            ]),
          ]),
        }}
      />

      <section className="mx-auto grid max-w-5xl items-center gap-8 md:grid-cols-[1fr_0.75fr] md:gap-14">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-sky px-3 py-1.5 text-xs font-semibold text-ink">
            💧 Water-can delivery for your home
          </div>
          <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-6xl">
            Water at home, <span className="text-accent">without the chase.</span>
          </h1>
          <p className="max-w-xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
            Find local suppliers for 20-litre water cans and choose a delivery routine that fits your household. Prices, deposits, availability and service areas are set by each supplier.
          </p>
          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <Link href="/app?category=water" className="inline-flex min-h-12 items-center justify-center rounded-[10px] bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90">
              Explore water delivery <span aria-hidden="true" className="ml-2">→</span>
            </Link>
            <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-[10px] border border-line bg-surface px-6 py-3 text-sm font-semibold text-ink transition hover:bg-white">
              Browse all services
            </Link>
          </div>
        </div>
        <div className="flex min-h-64 items-center justify-center rounded-[24px] bg-[#E7F2FC] p-8">
          <WaterCanIllustration className="h-44 w-44 sm:h-56 sm:w-56" />
        </div>
      </section>

      <section className="mx-auto max-w-5xl">
        <div className="mb-7 space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Make water delivery work for you</p>
          <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">A routine that fits your home.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[16px] border border-line bg-surface p-5">
            <span className="text-2xl" aria-hidden="true">🏠</span>
            <h3 className="mt-4 text-base font-semibold text-ink">For your household</h3>
            <p className="mt-2 text-sm leading-6 text-muted">Look for a supplier serving your street, apartment or neighbourhood.</p>
          </article>
          <article className="rounded-[16px] border border-line bg-surface p-5">
            <span className="text-2xl" aria-hidden="true">🔁</span>
            <h3 className="mt-4 text-base font-semibold text-ink">Repeat delivery</h3>
            <p className="mt-2 text-sm leading-6 text-muted">Ask about recurring schedules and the options available from your chosen supplier.</p>
          </article>
          <article className="rounded-[16px] border border-line bg-surface p-5">
            <span className="text-2xl" aria-hidden="true">♻️</span>
            <h3 className="mt-4 text-base font-semibold text-ink">Track empty cans</h3>
            <p className="mt-2 text-sm leading-6 text-muted">Where supported, the service account can help keep deliveries, returns and deposits clear.</p>
          </article>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-8 rounded-[20px] border border-line bg-white p-6 sm:p-9 md:grid-cols-2 md:items-center">
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Getting started</p>
          <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Choose a supplier that serves your area.</h2>
          <p className="text-sm leading-7 text-muted">Start by checking local availability, delivery frequency, can deposits and the price offered by each supplier. There is no universal price shared across all merchants.</p>
        </div>
        <ol className="space-y-4">
          <li className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky text-sm font-bold text-ink">1</span><div><p className="text-sm font-semibold text-ink">Check your neighbourhood</p><p className="mt-1 text-sm text-muted">Delivery coverage depends on each local business.</p></div></li>
          <li className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky text-sm font-bold text-ink">2</span><div><p className="text-sm font-semibold text-ink">Review price and terms</p><p className="mt-1 text-sm text-muted">Confirm the can price, deposits, payment options and delivery timings.</p></div></li>
          <li className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky text-sm font-bold text-ink">3</span><div><p className="text-sm font-semibold text-ink">Set your preferred routine</p><p className="mt-1 text-sm text-muted">Use the repeat-order or customer-link features your supplier supports.</p></div></li>
        </ol>
      </section>

      <section className="mx-auto max-w-5xl rounded-[20px] bg-[#E7F2FC] p-6 sm:p-9">
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">Supply water to local homes?</h2>
            <p className="max-w-2xl text-sm leading-6 text-muted">Manage your own products and pricing, customer subscriptions, delivery runs, empty-can returns and billing in the merchant workspace.</p>
          </div>
          <Link href="/merchant" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-[10px] bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">Open merchant portal <span aria-hidden="true" className="ml-2">→</span></Link>
        </div>
      </section>
    </div>
  );
}
