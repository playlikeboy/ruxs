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
      "No. Each household gets their own private link (ruxs.in/c/token). They can bookmark it or save it to their home screen. They tap Deliver, Skip, or Extra in one second with zero passwords.",
  },
  {
    question: "How do customer skips work before and after cutoff?",
    answer:
      "When a household taps Skip before your cutoff time (e.g. 10:00 AM), their meal is skipped at ₹0 charge and your kitchen count updates instantly. If they tap after cutoff, your late policy applies automatically (full charge, half charge, or locked).",
  },
  {
    question: "Does RUXS take a commission on payments?",
    answer:
      "Zero commission. Your customers pay directly to your own UPI ID (Google Pay, PhonePe, Paytm). The money goes straight from their bank to yours.",
  },
  {
    question: "How do 20L water suppliers track empty cans and deposits?",
    answer:
      "When your driver delivers, the run sheet defaults to 1 can out, 1 can in. The customer's bottle balance updates instantly. First-time container deposits are added to their khata automatically.",
  },
  {
    question: "Is RUXS really free to start?",
    answer:
      "Yes. The Free tier covers up to 20 active households forever with unlimited deliveries, run sheets, and bills.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-20 sm:space-y-28 pt-8 sm:pt-16">
      {/* Structured Data */}
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

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FFE8DD] text-accent rounded-full text-xs font-semibold">
          <span>✨ Replaces WhatsApp chats & paper khatas</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-ink leading-[1.1] max-w-3xl mx-auto">
          Run your whole day on one private link.
        </h1>

        <p className="text-base sm:text-xl text-muted max-w-2xl mx-auto leading-relaxed">
          For neighbourhood tiffin kitchens and 20L water suppliers. One tap for households to skip, one big count across the kitchen, driver run sheets top-floor down, and direct UPI bills.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/app"
            className="w-full sm:w-auto px-6 py-3.5 bg-accent text-white font-semibold text-sm rounded-[10px] hover:opacity-90 active:scale-98 transition-all shadow-sm"
          >
            Start Free (Up to 20 Households) →
          </Link>
          <Link
            href="/for/tiffin-services"
            className="w-full sm:w-auto px-5 py-3.5 bg-surface border border-line text-ink font-semibold text-sm rounded-[10px] hover:bg-[#FAFAF7] active:scale-98 transition-all"
          >
            See How It Works
          </Link>
        </div>

        <div className="pt-6 flex items-center justify-center gap-8 text-xs text-muted">
          <span>✓ No customer app download</span>
          <span>✓ Zero payment commission</span>
          <span>✓ 100% paise accuracy</span>
        </div>
      </section>

      {/* Interactive Mockup Preview */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-surface border border-line rounded-[16px] p-4 sm:p-8 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Customer Link */}
          <div className="p-4 bg-[#FAFAF7] border border-line rounded-[12px] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-accent">1. Household Link</span>
              <TiffinDabbaIllustration className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-ink">One Tap to Skip or Extra</h3>
            <p className="text-xs text-muted leading-relaxed">
              Households get their private link. Today is highlighted. One tap to Skip or add Extra before cutoff. No app download.
            </p>
            <div className="pt-2 flex gap-1.5 text-[11px] font-semibold">
              <span className="px-2.5 py-1 bg-good text-white rounded-[6px]">Deliver</span>
              <span className="px-2.5 py-1 bg-ink text-white rounded-[6px]">Skip</span>
              <span className="px-2.5 py-1 bg-accent text-white rounded-[6px]">+ Extra</span>
            </div>
          </div>

          {/* Card 2: Kitchen Display */}
          <div className="p-4 bg-[#FAFAF7] border border-line rounded-[12px] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-accent">2. Kitchen Lock</span>
              <WaterCanIllustration className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-ink">Big Count Across Room</h3>
            <p className="text-xs text-muted leading-relaxed">
              At 10:00 AM cutoff, orders lock in one snapshot. Big 48px count on your phone so cooks see the exact number clearly.
            </p>
            <div className="pt-2 font-mono font-bold text-3xl text-ink">
              42 <span className="text-xs font-sans font-normal text-muted">meals today</span>
            </div>
          </div>

          {/* Card 3: Driver Run Sheet */}
          <div className="p-4 bg-[#FAFAF7] border border-line rounded-[12px] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-accent">3. Driver Run</span>
              <ScooterIllustration className="w-10 h-7" />
            </div>
            <h3 className="text-sm font-bold text-ink">Top Floor Down</h3>
            <p className="text-xs text-muted leading-relaxed">
              Stops sorted society → tower → floor (descending) → flat. Driver takes the lift to the top and delivers on the way down.
            </p>
            <div className="pt-2 text-xs font-semibold text-good">
              ✓ Lift-optimized route
            </div>
          </div>
        </div>
      </section>

      {/* 3 Pains -> 3 Fixes */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            From morning chaos to a calm daily rhythm
          </h2>
          <p className="text-sm text-muted">
            Designed specifically for neighbourhood delivery workflows in India.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface border border-line rounded-[12px] p-5 space-y-3 shadow-xs">
            <div className="w-8 h-8 rounded-[8px] bg-[#FCE4EC] text-[#B42318] flex items-center justify-center font-bold text-sm">
              ✕
            </div>
            <h3 className="text-sm font-semibold text-ink">The 9:30 AM chat flood</h3>
            <p className="text-xs text-muted leading-relaxed">
              Dozens of WhatsApp messages asking &quot;No dabba today please&quot; right when the kitchen is bustling with cooking.
            </p>
            <div className="pt-2 text-xs font-medium text-accent">
              → Fixed: One private link. Skips lock automatically at cutoff.
            </div>
          </div>

          <div className="bg-surface border border-line rounded-[12px] p-5 space-y-3 shadow-xs">
            <div className="w-8 h-8 rounded-[8px] bg-[#FCE4EC] text-[#B42318] flex items-center justify-center font-bold text-sm">
              ✕
            </div>
            <h3 className="text-sm font-semibold text-ink">Lost paper khata records</h3>
            <p className="text-xs text-muted leading-relaxed">
              Tally marks in a notebook get smudged. End-of-month disputes over whether flat 402 skipped 3 meals or 5 meals.
            </p>
            <div className="pt-2 text-xs font-medium text-accent">
              → Fixed: Append-only ledger in integer paise. Zero forgotten entries.
            </div>
          </div>

          <div className="bg-surface border border-line rounded-[12px] p-5 space-y-3 shadow-xs">
            <div className="w-8 h-8 rounded-[8px] bg-[#FCE4EC] text-[#B42318] flex items-center justify-center font-bold text-sm">
              ✕
            </div>
            <h3 className="text-sm font-semibold text-ink">Chasing payments on the 1st</h3>
            <p className="text-xs text-muted leading-relaxed">
              Writing individual totals on WhatsApp and waiting days for households to ask for your QR code.
            </p>
            <div className="pt-2 text-xs font-medium text-accent">
              → Fixed: Itemised bills with one-tap universal UPI link straight to your bank.
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview Banner */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-[#FFF3C9] border border-line rounded-[16px] p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-block px-2.5 py-0.5 bg-white text-ink text-xs font-bold rounded-full">
              Simple Honest Pricing
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-ink">
              Free forever up to 20 households.
            </h2>
            <p className="text-xs sm:text-sm text-ink/80 max-w-md">
              Grow without worrying. Only ₹499/month when your business scales beyond 20 regular customers.
            </p>
          </div>

          <Link
            href="/pricing"
            className="px-6 py-3.5 bg-ink text-white font-semibold text-sm rounded-[10px] hover:bg-ink/90 active:scale-95 transition-all shrink-0"
          >
            Compare All Plans →
          </Link>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-muted">
            Everything you need to know about setting up your kitchen or water service.
          </p>
        </div>

        <div className="divide-y divide-line bg-surface border border-line rounded-[12px] overflow-hidden">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-5 space-y-2">
              <h3 className="text-sm font-semibold text-ink">{faq.question}</h3>
              <p className="text-xs text-muted leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6 pb-12">
        <KhataCheckIllustration className="w-16 h-16 mx-auto" />
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink">
          Start your kitchen on RUXS today.
        </h2>
        <p className="text-sm text-muted max-w-md mx-auto">
          Takes under 2 minutes to register. Add your products and share your first private customer link.
        </p>
        <div>
          <Link
            href="/app"
            className="inline-block px-8 py-3.5 bg-accent text-white font-semibold text-sm rounded-[10px] hover:opacity-90 active:scale-95 transition-all shadow-sm"
          >
            Create Your Business Link →
          </Link>
        </div>
      </section>
    </div>
  );
}
