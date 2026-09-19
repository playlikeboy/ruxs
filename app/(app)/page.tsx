import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "RUXS — Recurring household life, quietly handled",
  description:
    "RUXS gives households a calmer way to run recurring local services — meals, water, milk and more — with one default, clear cutoffs and a transparent account.",
  alternates: { canonical: "https://ruxs.in/" },
  openGraph: {
    title: "RUXS — Recurring household life, quietly handled",
    description: "A simple operating layer for recurring local household services in India.",
    url: "https://ruxs.in/",
    siteName: "RUXS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RUXS — Recurring household life, quietly handled",
    description: "Recurring local services, coordinated with less follow-up and more clarity.",
  },
};

const services = [
  { name: "Meals & tiffin", detail: "Daily plans, skips, extras and cutoff control." },
  { name: "20L water", detail: "Scheduled drops, container tracking and reorder flows." },
  { name: "Milk & dairy", detail: "Simple recurring quantities with pause and resume." },
  { name: "More local services", detail: "Laundry, newspapers, cleaning and other routines can share the same operating layer." },
];

const steps = [
  ["01", "Set the default", "Choose what should happen on an ordinary day. RUXS carries that preference forward."],
  ["02", "Change only when needed", "Use a quick action to skip, add, pause or resume before the service cutoff."],
  ["03", "Let operations lock", "Vendors see confirmed demand instead of chasing scattered messages."],
  ["04", "Review one clear account", "Daily activity rolls into a transparent statement instead of a paper notebook."],
];

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://ruxs.in/#organization",
        name: "RUXS",
        url: "https://ruxs.in/",
        logo: "https://ruxs.in/favicon.svg",
      },
      {
        "@type": "WebSite",
        "@id": "https://ruxs.in/#website",
        url: "https://ruxs.in/",
        name: "RUXS",
        publisher: { "@id": "https://ruxs.in/#organization" },
      },
      {
        "@type": "SoftwareApplication",
        name: "RUXS",
        applicationCategory: "ProductivityApplication",
        operatingSystem: "Web",
        url: "https://ruxs.in/",
        description:
          "A simple operating layer for recurring local household services in India.",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    <main className="bg-background text-foreground">
      <section className="ds-muted-grid border-b border-border">
        <div className="ds-container grid min-h-[calc(100vh-64px)] items-center gap-14 py-20 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
          <div className="max-w-3xl">
            <div className="ds-kicker">Everyday infrastructure</div>

            <h1 className="ds-display mt-7 max-w-4xl text-5xl leading-[0.94] text-foreground sm:text-6xl lg:text-[5.8rem]">
              Your household,
              <span className="block text-primary">without the follow-up.</span>
            </h1>

            <p className="mt-8 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              RUXS is the operating layer behind recurring local services.
              Set a default once, make a quick change when life changes, and keep
              the record clear for both the household and the vendor.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/subscribe" className="ds-button">
                Set up a service
              </Link>
              <Link href="/vendor/onboard" className="ds-button-secondary">
                For local vendors
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-subtle">
              <span>Recurring by default</span>
              <span>Clear cutoffs</span>
              <span>Transparent account</span>
            </div>
          </div>

          <div className="ds-card relative overflow-hidden p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle">Today</p>
                <p className="mt-1 text-sm font-semibold text-foreground">Morning household run</p>
              </div>
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                AUTOPILOT
              </span>
            </div>

            <div className="divide-y divide-border">
              {[
                ["08:30", "Water", "2 × 20L", "Scheduled"],
                ["10:00", "Lunch", "1 meal", "Cutoff"],
                ["18:30", "Milk", "1L", "Scheduled"],
              ].map(([time, name, quantity, state]) => (
                <div key={name} className="grid grid-cols-[64px_1fr_auto] items-center gap-3 py-4">
                  <span className="font-mono text-[11px] text-subtle">{time}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{quantity}</p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle">{state}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-border bg-background/60 p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Digital Khata</span>
                <span className="font-mono font-semibold text-foreground">₹1,240 due</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[72%] rounded-full bg-primary" />
              </div>
              <p className="mt-2 text-[11px] text-subtle">Every fulfilled day has a visible line item.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="ds-section">
        <div className="ds-container">
          <div className="max-w-2xl">
            <div className="ds-kicker">One operating layer</div>
            <h2 className="ds-display mt-5 text-4xl leading-tight sm:text-5xl">
              The service can change.
              <span className="block text-muted-foreground">The operating model does not.</span>
            </h2>
          </div>

          <div className="mt-14 grid border-t border-border sm:grid-cols-2">
            {services.map((service, index) => (
              <article key={service.name} className={[
                "py-7 sm:pr-8",
                index === 1 || index === 3 ? "sm:border-l sm:border-border sm:pl-8" : "",
                index >= 2 ? "border-t border-border" : "",
              ].join(" ")}>
                <p className="text-xs font-mono text-subtle">0{index + 1}</p>
                <h3 className="mt-3 text-lg font-semibold text-foreground">{service.name}</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{service.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface-band">
        <div className="ds-container grid gap-10 py-14 lg:grid-cols-3">
          {[
            ["01", "A default you can trust", "Households should not need to repeat the same instruction every morning."],
            ["02", "A cutoff everyone sees", "Customers, kitchens and drivers work from the same operational clock."],
            ["03", "An account that explains itself", "Fulfillment, payment and adjustments should leave a readable trail."],
          ].map(([number, title, detail]) => (
            <div key={number}>
              <p className="font-mono text-xs text-primary">{number}</p>
              <h3 className="mt-3 text-xl font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="ds-section">
        <div className="ds-container grid gap-14 lg:grid-cols-[.75fr_1.25fr]">
          <div>
            <div className="ds-kicker">How it works</div>
            <h2 className="ds-display mt-5 text-4xl leading-tight sm:text-5xl">Quiet software for repetitive days.</h2>
            <p className="mt-6 max-w-md text-sm leading-6 text-muted-foreground">
              RUXS is designed so people touch the system when something changes,
              not because the system needs attention every day.
            </p>
          </div>

          <div className="divide-y divide-border border-y border-border">
            {steps.map(([number, title, detail]) => (
              <div key={number} className="grid gap-5 py-7 sm:grid-cols-[70px_1fr]">
                <span className="font-mono text-xs text-subtle">{number}</span>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="ledger" className="pb-24 sm:pb-32">
        <div className="ds-container">
          <div className="ds-card overflow-hidden p-7 sm:p-10">
            <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="max-w-2xl">
                <div className="ds-kicker">The account behind the routine</div>
                <h2 className="ds-display mt-5 text-4xl leading-tight sm:text-5xl">
                  Clear enough for a household. Structured enough for a vendor.
                </h2>
                <p className="mt-6 text-sm leading-6 text-muted-foreground">
                  RUXS brings daily fulfillment, adjustments and payments into one
                  readable digital Khata. The goal is simple: fewer arguments,
                  fewer follow-ups, and a record people can actually understand.
                </p>
              </div>
              <Link href="/subscribe" className="ds-button whitespace-nowrap">Start with a recurring service</Link>
            </div>

            <div className="mt-10 ds-rule" />
            <div className="mt-7 grid gap-6 text-xs sm:grid-cols-3">
              <div><p className="font-semibold text-foreground">Fulfillment</p><p className="mt-1 text-muted-foreground">What was scheduled and what happened.</p></div>
              <div><p className="font-semibold text-foreground">Cutoff</p><p className="mt-1 text-muted-foreground">When the operational window closed.</p></div>
              <div><p className="font-semibold text-foreground">Payment</p><p className="mt-1 text-muted-foreground">What was charged, paid or adjusted.</p></div>
            </div>
          </div>
        </div>
      </section>
    </main>
    </>
  );
}
