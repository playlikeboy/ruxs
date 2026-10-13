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
    "Run your entire tiffin or 20L water business on one private link instead of WhatsApp chats and paper khatas. One tap to skip, one kitchen count, driver run sheet, and direct UPI bills.",
  path: "",
});

const faqs = [
  {
    question: "Do my customers need to download an app?",
    answer:
      "No. Each household gets their own private link. They can bookmark it or save it to their home screen. They tap Deliver, Skip, or Extra without installing anything.",
  },
  {
    question: "How do customer skips work before and after cutoff?",
    answer:
      "When a household taps Skip before your cutoff time, their meal is skipped at ₹0 charge and your kitchen count updates. If they tap after cutoff, your late policy applies automatically.",
  },
  {
    question: "Does RUXS take a commission on payments?",
    answer:
      "No. Customers pay directly to your own UPI ID. The money goes straight from their bank to yours.",
  },
  {
    question: "How do 20L water suppliers track empty cans and deposits?",
    answer:
      "The delivery run sheet helps record cans out and returned at each door. Container balances and deposits stay visible in the household account.",
  },
  {
    question: "Is RUXS really free to start?",
    answer:
      "Yes. The Free tier covers up to 20 active households with the core daily workflow.",
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
            A calmer daily operating system for neighbourhood tiffin kitchens and 20L water suppliers. Keep orders, routes and household accounts in sync — without the spreadsheet scramble.
          </p>
          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <Link
              href="/app"
              className="inline-flex min-h-12 items-center justify-center rounded-[10px] bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
            >
              Start free — up to 20 households <span aria-hidden="true" className="ml-2">→</span>
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
            <span><span className="mr-1 text-good">✓</span>Zero payment commission</span>
            <span><span className="mr-1 text-good">✓</span>Direct UPI payments</span>
          </div>
          <p className="pt-1 text-xs text-muted">Built for the neighbourhood. <Link href="/about" className="font-semibold text-accent underline-offset-4 hover:underline">Get to know RUXS →</Link></p>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div aria-hidden="true" className="absolute inset-4 rotate-3 rounded-[28px] bg-peach" />
          <div className="relative rounded-[20px] border border-line bg-surface p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <p className="text-xs font-semibold text-muted">TUESDAY · KITCHEN OVERVIEW</p>
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
                  <span className="text-xs text-muted">Monthly khata</span>
                  <KhataCheckIllustration className="h-8 w-8" />
                </div>
                <p className="mt-1 text-sm font-semibold text-ink">All itemised</p>
                <p className="mt-2 text-xs font-medium text-accent">UPI bill links</p>
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
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Built for the people behind the service</p>
            <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Good local businesses deserve software that feels local, too.</h2>
            <p className="text-sm leading-7 text-muted sm:text-base">We believe neighbourhood businesses should grow without losing the personal relationships that made them trusted in the first place. RUXS keeps the workflow simple and the payment relationship direct.</p>
            <Link href="/about" className="inline-flex items-center pt-1 text-sm font-semibold text-accent hover:underline">Meet RUXS <span aria-hidden="true" className="ml-2">→</span></Link>
          </div>
          <div className="flex items-center justify-center gap-5 rounded-[14px] bg-[#FFF3C9] p-7">
            <TiffinDabbaIllustration className="h-24 w-24 sm:h-28 sm:w-28" />
            <div className="max-w-[180px] space-y-2">
              <p className="text-lg font-semibold leading-snug text-ink">Small tools. Less daily chaos.</p>
              <p className="text-sm leading-6 text-muted">Calm, practical and built around real routines.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-[16px] bg-[#FFF3C9] p-6 sm:flex-row sm:items-center sm:p-10">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">Straightforward pricing</p>
            <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Free forever up to 20 households.</h2>
            <p className="max-w-lg text-sm leading-6 text-ink/80">Start with the essentials. Grow into more customers and more capable plans as your route expands.</p>
          </div>
          <Link href="/pricing" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-[10px] bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90">Compare plans <span aria-hidden="true" className="ml-2">→</span></Link>
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
          <Link href="/app" className="inline-flex min-h-12 items-center justify-center rounded-[10px] bg-accent px-7 py-3 text-sm font-semibold text-white transition hover:opacity-90">Start for free <span aria-hidden="true" className="ml-2">→</span></Link>
          <Link href="/about" className="inline-flex min-h-12 items-center justify-center rounded-[10px] border border-line bg-surface px-7 py-3 text-sm font-semibold text-ink transition hover:bg-white">About RUXS</Link>
        </div>
      </section>
    </div>
  );
}
