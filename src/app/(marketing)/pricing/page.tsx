import { UiIcon } from "@/components/ui/app-icon";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import Link from "next/link";
import { buildMetadata, breadcrumbsJsonLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "How Service Pricing Works",
  description:
    "RUXs does not set one universal price for kids' classes, tiffin, water-can delivery or other local services. Each merchant sets their own prices and terms; the RUXs Store sets its own prices for the kits it sells.",
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
          A dance class from one academy can cost differently from a similar class elsewhere, and the same goes for a tiffin plan, a water can, a fitness package or a physio session. Deposits, delivery terms and schedules differ too. RUXs does not impose a universal price across local businesses. The one exception is the RUXs Store, where RUXs sells its own kids&apos; kits and sets those prices itself.
        </p>
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-[16px] border border-line bg-surface p-5">
          <UiIcon name="tiffin" className="h-6 w-6 text-accent" />
          <h2 className="mt-4 text-base font-semibold text-ink">Tiffin &amp; meal plans</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Each kitchen chooses its own menu, portion options, meal price and recurring plan.</p>
        </article>
        <article className="rounded-[16px] border border-line bg-surface p-5">
          <UiIcon name="water" className="h-6 w-6 text-accent" />
          <h2 className="mt-4 text-base font-semibold text-ink">Water-can delivery</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Suppliers set their own can price, deposit, delivery schedule and coverage area.</p>
        </article>
        <article className="rounded-[16px] border border-line bg-surface p-5">
          <UiIcon name="date" className="h-6 w-6 text-accent" />
          <h2 className="mt-4 text-base font-semibold text-ink">Recurring subscriptions</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Terms such as active days, skip cutoffs, billing periods and pauses depend on the provider.</p>
        </article>
        <article className="rounded-[16px] border border-line bg-surface p-5">
          <UiIcon name="cap" className="h-6 w-6 text-accent" />
          <h2 className="mt-4 text-base font-semibold text-ink">Kids classes &amp; RUXs Store</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Class providers set their own session, pass and workshop prices. The RUXs Store sets its own prices for the kits and supplies it sells, delivering in Ranchi for now.</p>
        </article>
      </section>
      <section className="rounded-card border border-line bg-surface p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-ink">Before choosing a service</h2>
        <p className="mt-3 text-sm leading-7 text-muted">
          Check the selected merchant&apos;s current price, service area, schedule, any deposit and cancellation rules. Availability and actual offers are merchant-specific. Public marketplace listings and checkout are still being expanded, so this page is a pricing explainer—not a list of live offers or a promise that every service can be ordered online today.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/for/kids" className="px-5">
            Explore kids&apos; classes and kits <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </ButtonLink>
          <ButtonLink href="/app" variant="secondary" className="px-5">
            Browse all services
          </ButtonLink>
        </div>
      </section>
      <section className="border-t border-line pt-6">
        <h2 className="text-lg font-semibold text-ink">Are you a merchant?</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Kitchens, stores, trainers and kids class providers manage their own prices, plans or classes, orders or bookings and customer accounts from the separate RUXs merchant workspace.</p>
        <Link href="/merchant-panel" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-accent underline-offset-4 hover:underline">
          Open merchant portal <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
