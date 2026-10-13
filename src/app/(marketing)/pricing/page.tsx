import Link from "next/link";
import { buildMetadata, faqJsonLd, breadcrumbsJsonLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Pricing Plans — Zero Commission",
  description:
    "Free forever up to 20 active households. Simple, honest pricing for growing tiffin kitchens and water suppliers across India. No commissions on your payments.",
  path: "/pricing",
});

const pricingFaqs = [
  {
    question: "Do you take any percentage or commission on orders?",
    answer:
      "Never. RUXS charges zero commission on payments. Your customers pay your UPI ID directly. 100% of the money goes straight to your bank account.",
  },
  {
    question: "What happens when I cross 20 households on the Free tier?",
    answer:
      "Your existing 20 households continue without interruption. You can upgrade to Starter (₹499/mo) whenever you are ready to add up to 100 households.",
  },
  {
    question: "Can I invite delivery boys or kitchen staff?",
    answer:
      "Yes. The Starter plan includes up to 3 staff logins so your delivery drivers can access today's run sheet on their own phones.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes, there are no lock-in contracts. You can switch plans or cancel at any time.",
  },
];

export default function PricingPage() {
  return (
    <div className="space-y-16 pt-8 sm:pt-16 max-w-4xl mx-auto px-4 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbsJsonLd([
              { name: "Home", path: "/" },
              { name: "Pricing", path: "/pricing" },
            ]),
            faqJsonLd(pricingFaqs),
          ]),
        }}
      />

      <div className="text-center space-y-3">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-ink">
          Honest pricing. Zero commission.
        </h1>
        <p className="text-base text-muted max-w-xl mx-auto">
          Start for free today. Upgrade only as your neighbourhood delivery route grows.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Free Plan */}
        <div className="bg-surface border border-line rounded-[16px] p-6 space-y-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div>
              <span className="text-xs font-bold text-accent uppercase tracking-wider">
                Neighbourhood
              </span>
              <h2 className="text-xl font-bold text-ink mt-1">Free Tier</h2>
              <p className="text-xs text-muted mt-1">
                Perfect for starting a local tiffin service or small water route.
              </p>
            </div>

            <div className="pt-2">
              <span className="text-4xl font-extrabold font-mono text-ink">₹0</span>
              <span className="text-xs text-muted ml-1">/ month</span>
            </div>

            <ul className="pt-3 space-y-2 text-xs text-ink/90 border-t border-line">
              <li className="flex items-center gap-2">✓ Up to 20 active households</li>
              <li className="flex items-center gap-2">✓ Full daily run sheets</li>
              <li className="flex items-center gap-2">✓ Household private links</li>
              <li className="flex items-center gap-2">✓ Append-only khata ledger</li>
              <li className="flex items-center gap-2">✓ Direct UPI bills</li>
            </ul>
          </div>

          <Link
            href="/app"
            className="w-full py-2.5 px-4 bg-[#FAFAF7] hover:bg-white border border-line text-ink font-semibold text-xs rounded-[10px] text-center active:scale-95 transition-all block mt-4"
          >
            Get Started Free
          </Link>
        </div>

        {/* Starter Plan */}
        <div className="bg-surface border-2 border-accent rounded-[16px] p-6 space-y-5 shadow-sm flex flex-col justify-between relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-accent text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
            Most Popular
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-xs font-bold text-accent uppercase tracking-wider">
                Growing Kitchen
              </span>
              <h2 className="text-xl font-bold text-ink mt-1">Starter</h2>
              <p className="text-xs text-muted mt-1">
                For established daily kitchens and water suppliers in residential clusters.
              </p>
            </div>

            <div className="pt-2">
              <span className="text-4xl font-extrabold font-mono text-ink">₹499</span>
              <span className="text-xs text-muted ml-1">/ month</span>
            </div>

            <ul className="pt-3 space-y-2 text-xs text-ink/90 border-t border-line">
              <li className="flex items-center gap-2">✓ Up to 100 active households</li>
              <li className="flex items-center gap-2">✓ Up to 3 staff & driver logins</li>
              <li className="flex items-center gap-2">✓ Unlimited shifts & products</li>
              <li className="flex items-center gap-2">✓ Can & dabba bottle tracking</li>
              <li className="flex items-center gap-2">✓ Priority route ordering</li>
            </ul>
          </div>

          <Link
            href="/app"
            className="w-full py-2.5 px-4 bg-accent text-white font-semibold text-xs rounded-[10px] text-center hover:opacity-90 active:scale-95 transition-all block mt-4 shadow-xs"
          >
            Choose Starter
          </Link>
        </div>

        {/* Pro Plan */}
        <div className="bg-surface border border-line rounded-[16px] p-6 space-y-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div>
              <span className="text-xs font-bold text-muted uppercase tracking-wider">
                Full Commercial
              </span>
              <h2 className="text-xl font-bold text-ink mt-1">Pro</h2>
              <p className="text-xs text-muted mt-1">
                For large kitchens and multi-vehicle delivery operations.
              </p>
            </div>

            <div className="pt-2">
              <span className="text-4xl font-extrabold font-mono text-ink">₹1,499</span>
              <span className="text-xs text-muted ml-1">/ month</span>
            </div>

            <ul className="pt-3 space-y-2 text-xs text-ink/90 border-t border-line">
              <li className="flex items-center gap-2">✓ Unlimited households</li>
              <li className="flex items-center gap-2">✓ Unlimited driver accounts</li>
              <li className="flex items-center gap-2">✓ Multi-area route sheets</li>
              <li className="flex items-center gap-2">✓ Custom late-fee rules</li>
              <li className="flex items-center gap-2">✓ Dedicated phone support</li>
            </ul>
          </div>

          <Link
            href="/app"
            className="w-full py-2.5 px-4 bg-[#FAFAF7] hover:bg-white border border-line text-ink font-semibold text-xs rounded-[10px] text-center active:scale-95 transition-all block mt-4"
          >
            Choose Pro
          </Link>
        </div>
      </div>

      {/* Pricing FAQs */}
      <div className="space-y-6 pt-6">
        <h2 className="text-2xl font-bold text-ink text-center">
          Pricing Questions
        </h2>
        <div className="divide-y divide-line bg-surface border border-line rounded-[12px] overflow-hidden">
          {pricingFaqs.map((faq, idx) => (
            <div key={idx} className="p-5 space-y-1.5">
              <h3 className="text-sm font-semibold text-ink">{faq.question}</h3>
              <p className="text-xs text-muted leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
