import Link from "next/link";
import { buildMetadata, breadcrumbsJsonLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "How Service Pricing Works",
  description:
    "RUXS does not set one universal price for tiffin subscriptions or water-can delivery. Each local merchant sets their own prices, plans, deposits and service terms.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-12 px-4 pb-12 pt-10 sm:px-6 sm:pt-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbsJsonLd([
              { name: "Home", path: "/" },
              { name: "How Pricing Works", path: "/pricing" },
            ]),
          ]),
        }}
      />
      <section className="space-y-5">
        <span className="inline-flex rounded-full bg-peach px-3 py-1.5 text-xs font-semibold text-ink">
          Clear, local pricing
        </span>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-6xl">
          One platform. <span className="text-accent">Each merchant sets their own price.</span>
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted sm:text-lg">
          A tiffin plan from one kitchen can cost differently from a similar plan elsewhere. Water-can prices, deposits, delivery terms and subscription schedules can differ too. RUXS does not impose a universal menu or subscription price across local businesses.
        </p>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-[16px] border border-line bg-surface p-5">
          <span className="text-2xl" aria-hidden="true">🍱</span>
          <h2 className="mt-4 text-base font-semibold text-ink">Tiffin & meal plans</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Each kitchen chooses its own menu, portion options, meal price and recurring plan.</p>
        </article>
        <article className="rounded-[16px] border border-line bg-surface p-5">
          <span className="text-2xl" aria-hidden="true">💧</span>
          <h2 className="mt-4 text-base font-semibold text-ink">Water-can delivery</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Suppliers set their own can price, deposit, delivery schedule and coverage area.</p>
        </article>
        <article className="rounded-[16px] border border-line bg-surface p-5">
          <span className="text-2xl" aria-hidden="true">🗓️</span>
          <h2 className="mt-4 text-base font-semibold text-ink">Recurring subscriptions</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Terms such as active days, skip cutoffs, billing periods and pauses depend on the provider.</p>
        </article>
      </section>
      <section className="rounded-[18px] border border-line bg-white p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-ink">Before choosing a service</h2>
        <p className="mt-3 text-sm leading-7 text-muted">
          Check the selected merchant's current price, service area, delivery schedule, container deposit and cancellation rules. Availability and actual offers are merchant-specific. Public marketplace listings and checkout are still being expanded, so this page is a pricing explainer—not a list of live offers or a promise that every service can be ordered online today.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/for/tiffin-services" className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
            Explore tiffin services <span aria-hidden="true" className="ml-2">→</span>
          </Link>
          <Link href="/for/water-suppliers" className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-ink hover:bg-bg">
            Explore water delivery
          </Link>
        </div>
      </section>
      <section className="border-t border-line pt-6">
        <h2 className="text-lg font-semibold text-ink">Are you a merchant?</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Manage your own product prices, recurring subscriptions, deliveries and customer accounts from the separate RUXS merchant workspace.</p>
        <Link href="/app" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">
          Open merchant portal <span aria-hidden="true">→</span>
        </Link>
      </section>
    </div>
  );
}
