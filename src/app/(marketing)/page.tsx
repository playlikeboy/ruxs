import Link from "next/link";
import {
  buildMetadata,
  softwareApplicationJsonLd,
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
  title: "RUXS — Daily Operating System for Tiffin Kitchens and Water Suppliers",
  description:
    "Run your tiffin or 20L water business with one private household link, clear daily counts, delivery runs and itemised accounts. Every business sets its own product prices.",
  path: "",
});

const faqs = [
  {
    question: "Do my customers need to download an app?",
    answer:
      "No. Each household gets its own private link. They can bookmark it or save it to their home screen, then tap Deliver, Skip or Extra without installing anything.",
  },
  {
    question: "Can every vendor set their own prices?",
    answer:
      "Yes. Each business creates its own products and sets its own meal, water-can, deposit and subscription prices. RUXS does not impose one universal price for the same item across vendors.",
  },
  {
    question: "Does RUXS take a commission on payments?",
    answer:
      "No. Customers pay directly to the vendor's own UPI ID. RUXS does not take a percentage of those payments.",
  },
  {
    question: "How do water suppliers track cans and deposits?",
    answer:
      "The delivery run sheet records cans delivered and returned at each home. Household balances and any configured deposits stay visible in the account.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-20 pt-8 sm:space-y-28 sm:pt-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            organizationJsonLd(),
            softwareApplicationJsonLd(),
            faqJsonLd(faqs),
          ]),
        }}
      />

      <section className="mx-auto grid max-w-5xl items-center gap-10 px-4 sm:px-6 md:grid-cols-[1.05fr_0.95fr] md:gap-12">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-peach px-3 py-1.5 text-xs font-semibold text-ink">
            <span className="h-2 w-2 rounded-full bg-accent" />
            Less admin. More good mornings.
          </div>
          <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-6xl">
            Run your whole day on <span className="text-accent">one private link.</span>
          </h1>
          <p className="max-w-xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
            A calmer daily operating system for neighbourhood tiffin kitchens and 20L water suppliers. Keep orders, delivery routes and household accounts in sync — without the spreadsheet scramble.
          </p>
          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <Link
              href="/app"
              className="inline-flex min-h-12 items-center justify-center rounded-[10px] bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
            >
              Start using RUXS <span aria-hidden="true" className="ml-2">→</span>
            </Link>
            <Link
              href="/for/tiffin-services"
              className="inline-flex min-h-12 items-center justify-center rounded-[10px] border border-line bg-surface px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white"
            >
              See how it works
            </Link>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2 text-xs font-medium text-muted">
            <span><span className="mr-1 text-good">✓</span>No customer app</span>
            <span><span className="mr-1 text-good">✓</span>Vendor-set prices</span>
            <span><span className="mr-1 text-good">✓</span>Direct UPI payments</span>
          </div>
          <p className="pt-1 text-xs text-muted">
            Built for the neighbourhood.{" "}
            <Link href="/about" className="font-semibold text-accent underline-offset-4 hover:underline">Get to know RUXS →</Link>
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div aria-hidden="true" className="absolute inset-4 rotate-3 rounded-[28px] bg-peach" />
          <div className="relative rounded-[20px] border border-line bg-surface p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <p className="text-xs font-semibold text-muted">KITCHEN OVERVIEW</p>
                <p className="mt-1 text-lg font-semibold tracking-tight text-ink">Good morning, Annapurna</p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-peach font-extrabold text-accent">R</span>
            </div>
            <div className="mt-5 rounded-[14px] bg-bg p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-muted">Today&apos;s kitchen count</p>
                  <p className="mt-1 text-5xl font-semibold tracking-tight text-ink tabular-nums">42</p>
                  <p className="mt-1 text-xs text-muted">meals confirmed</p>
                </div>
                <TiffinDabbaIllustration className="h-20 w-20 sm:h-24 sm:w-24" />
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-line">
                <div className="h-full w-[78%] rounded-full bg-good" />
              </div>
              <p className="mt-2 text-xs text-muted">31 regular · 11 Jain</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-[12px] border border-line p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">Delivery run</span>
                  <ScooterIllustration className="h-8 w-12" />
                </div>
                <p className="mt-1 text-sm font-semibold text-ink">18 stops left</p>
                <p className="mt-2 text-xs font-medium text-good">✓ Route ready</p>
              </div>
              <div className="rounded-[12px] border border-line p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">Household account</span>
                  <KhataCheckIllustration className="h-8 w-8" />
                </div>
                <p className="mt-1 text-sm font-semibold text-ink">Itemised records</p>
                <p className="mt-2 text-xs font-medium text-accent">Direct UPI bill</p>
              </div>
            </div>
          </div>
          <div aria-hidden="true" className="absolute -bottom-5 -left-5 hidden rounded-[12px] border border-line bg-surface p-3 sm:block">
            <WaterCanIllustration className="h-12 w-12" />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mb-8 max-w-2xl space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">A simple daily rhythm</p>
          <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">From morning messages to a day that just flows.</h2>
          <p className="text-sm leading-6 text-muted sm:text-base">A few thoughtful tools, connected around the way local delivery actually works.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <article className="space-y-3 rounded-[14px] border border-line bg-surface p-5">
            <div className="flex items-center justify-between"><span className="text-xs font-bold text-accent">01 · HOUSEHOLD LINK</span><TiffinDabbaIllustration className="h-12 w-12" /></div>
            <h3 className="text-base font-semibold text-ink">One tap, no back-and-forth</h3>
            <p className="text-sm leading-6 text-muted">Households tell you Deliver, Skip or Extra from their own link. No app download or new account needed.</p>
          </article>
          <article className="space-y-3 rounded-[14px] border border-line bg-surface p-5">
            <div className="flex items-center justify-between"><span className="text-xs font-bold text-accent">02 · CUTOFF COUNT</span><WaterCanIllustration className="h-12 w-12" /></div>
            <h3 className="text-base font-semibold text-ink">Know what to prepare</h3>
            <p className="text-sm leading-6 text-muted">Your cutoff locks a clear count for the day, helping the kitchen plan portions and reduce avoidable waste.</p>
          </article>
          <article className="space-y-3 rounded-[14px] border border-line bg-surface p-5">
            <div className="flex items-center justify-between"><span className="text-xs font-bold text-accent">03 · DELIVERY & KHATA</span><ScooterIllustration className="h-12 w-16" /></div>
            <h3 className="text-base font-semibold text-ink">Deliver. Record. Reconcile.</h3>
            <p className="text-sm leading-6 text-muted">A top-floor-first run sheet, visible household balances and itemised bill links help everyone stay on the same page.</p>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid gap-8 rounded-[18px] border border-line bg-surface p-6 sm:p-9 md:grid-cols-[1fr_0.8fr] md:items-center">
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Your business, your prices</p>
            <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">One product name. Different businesses. Different prices.</h2>
            <p className="text-sm leading-7 text-muted sm:text-base">
              Every merchant manages their own catalogue, prices, deposits and recurring subscriptions. A regular tiffin at one kitchen can cost differently from a similar meal at another — RUXS keeps each merchant&apos;s pricing separate.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link href="/for/tiffin-services" className="text-sm font-semibold text-accent hover:underline">For tiffin kitchens →</Link>
              <Link href="/for/water-suppliers" className="text-sm font-semibold text-accent hover:underline">For water suppliers →</Link>
            </div>
          </div>
          <div className="flex items-center justify-center gap-5 rounded-[14px] bg-[#FFF3C9] p-7">
            <TiffinDabbaIllustration className="h-24 w-24 sm:h-28 sm:w-28" />
            <div className="max-w-[180px] space-y-2">
              <p className="text-lg font-semibold leading-snug text-ink">Local service, local pricing.</p>
              <p className="text-sm leading-6 text-muted">No universal menu prices imposed across vendors.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-7 space-y-2 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">A few common questions</h2>
          <p className="text-sm text-muted">Clear answers before you get started.</p>
        </div>
        <div className="divide-y divide-line overflow-hidden rounded-[12px] border border-line bg-surface">
          {faqs.map((faq) => (
            <div key={faq.question} className="space-y-2 p-5">
              <h3 className="text-sm font-semibold text-ink">{faq.question}</h3>
              <p className="text-sm leading-6 text-muted">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-12 text-center sm:px-6">
        <KhataCheckIllustration className="mx-auto h-16 w-16" />
        <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Make tomorrow&apos;s work a little easier.</h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted sm:text-base">Bring your regular customers, set up your routine, and let RUXS take care of the little details that add up.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/app" className="inline-flex min-h-12 items-center justify-center rounded-[10px] bg-accent px-7 py-3 text-sm font-semibold text-white transition hover:opacity-90">Start using RUXS <span aria-hidden="true" className="ml-2">→</span></Link>
          <Link href="/about" className="inline-flex min-h-12 items-center justify-center rounded-[10px] border border-line bg-surface px-7 py-3 text-sm font-semibold text-ink transition hover:bg-white">About RUXS</Link>
        </div>
      </section>
    </div>
  );
}
