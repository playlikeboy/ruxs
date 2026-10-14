import Link from "next/link";
import { buildMetadata, breadcrumbsJsonLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Find Tiffin & Water Delivery in Bengaluru",
  description:
    "Explore neighbourhood tiffin subscriptions and 20L water-can delivery around HSR Layout, Koramangala, Bellandur, Whitefield and more. Local merchant prices and availability vary.",
  path: "/in/bengaluru",
});

const clusters = [
  {
    area: "HSR Layout & BTM",
    description: "Explore meal routines and household essentials around HSR Layout, BTM and nearby residential areas.",
  },
  {
    area: "Koramangala & Indiranagar",
    description: "Look for neighbourhood tiffin kitchens, lunch options and water-can suppliers serving your street.",
  },
  {
    area: "Bellandur & Marathahalli",
    description: "Find local services around apartment communities and the Outer Ring Road corridor.",
  },
  {
    area: "Whitefield & Electronic City",
    description: "Explore recurring meal and water delivery options near residential layouts and working hubs.",
  },
];

export default function BengaluruPage() {
  return (
    <div className="space-y-16 px-4 pb-12 pt-10 sm:px-6 sm:pt-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbsJsonLd([
              { name: "Home", path: "/" },
              { name: "Bengaluru", path: "/in/bengaluru" },
            ]),
          ]),
        }}
      />

      <section className="mx-auto max-w-4xl space-y-5 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-peach px-3 py-1.5 text-xs font-semibold text-accent">
          📍 Everyday essentials in Bengaluru
        </div>
        <h1 className="mx-auto max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-6xl">
          Find your local <span className="text-accent">everyday essentials.</span>
        </h1>
        <p className="mx-auto max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
          Explore tiffin subscriptions, daily meals and 20L water-can delivery from neighbourhood businesses. Service areas, schedules and prices are set by each merchant.
        </p>
        <div className="flex flex-col justify-center gap-3 pt-1 sm:flex-row">
          <Link href="/for/tiffin-services" className="inline-flex min-h-12 items-center justify-center rounded-[10px] bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90">
            Explore tiffin services <span aria-hidden="true" className="ml-2">→</span>
          </Link>
          <Link href="/for/water-suppliers" className="inline-flex min-h-12 items-center justify-center rounded-[10px] border border-line bg-surface px-6 py-3 text-sm font-semibold text-ink transition hover:bg-white">
            Find water delivery
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl">
        <div className="mb-7 space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Explore by area</p>
          <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Start with your part of Bengaluru.</h2>
          <p className="text-sm leading-6 text-muted">These neighbourhoods are a starting point for discovery. Actual provider availability may vary by street and merchant.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {clusters.map((cluster) => (
            <article key={cluster.area} className="rounded-[15px] border border-line bg-surface p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-peach text-lg" aria-hidden="true">⌖</span>
                <div className="space-y-1.5">
                  <h3 className="text-base font-semibold text-ink">{cluster.area}</h3>
                  <p className="text-sm leading-6 text-muted">{cluster.description}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
        <article className="rounded-[18px] bg-[#FFF0E8] p-6 sm:p-8">
          <span className="text-2xl" aria-hidden="true">🍱</span>
          <h2 className="mt-4 text-xl font-semibold tracking-tight text-ink">Meals that become a routine</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Discover a local kitchen, review its own plans and price, then choose a meal schedule that suits your week.</p>
          <Link href="/for/tiffin-services" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">Browse meal services <span aria-hidden="true">→</span></Link>
        </article>
        <article className="rounded-[18px] bg-[#E7F2FC] p-6 sm:p-8">
          <span className="text-2xl" aria-hidden="true">💧</span>
          <h2 className="mt-4 text-xl font-semibold tracking-tight text-ink">Water delivery for your home</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Look for a 20L water-can supplier serving your area and check delivery frequency, deposit and payment terms.</p>
          <Link href="/for/water-suppliers" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">Browse water delivery <span aria-hidden="true">→</span></Link>
        </article>
      </section>

      <section className="mx-auto max-w-5xl rounded-[20px] border border-line bg-white p-6 sm:p-9">
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">Run a local service business in Bengaluru?</h2>
            <p className="max-w-2xl text-sm leading-6 text-muted">RUXS also has a dedicated merchant workspace for recurring subscriptions, customer accounts, delivery runs and billing. Your business sets its own catalogue and prices.</p>
          </div>
          <Link href="/app" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-[10px] bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">Merchant portal <span aria-hidden="true" className="ml-2">→</span></Link>
        </div>
      </section>
    </div>
  );
}
